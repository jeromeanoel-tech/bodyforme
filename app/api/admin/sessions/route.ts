import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getAdminSession } from '@/lib/adminSession'


export async function GET(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const serviceId = req.nextUrl.searchParams.get('serviceId')
  if (!serviceId) return NextResponse.json({ error: 'serviceId required' }, { status: 400 })

  const { data, error } = await supabase
    .from('sessions')
    .select('id, title, instructor_name, start_time, end_time, capacity, status')
    .eq('service_id', serviceId)
    .order('start_time')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sessions: data ?? [] })
}

export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { sessions: batch, serviceId, serviceName, instructorName, startTime, endTime, capacity } = body

  if (!serviceId) return NextResponse.json({ error: 'serviceId required' }, { status: 400 })

  // Batch insert: array of { startTime, endTime } for recurring sessions
  if (Array.isArray(batch)) {
    if (batch.length === 0) return NextResponse.json({ error: 'sessions array is empty' }, { status: 400 })
    const rows = batch.map((s: { startTime: string; endTime: string }) => ({
      service_id:      serviceId,
      title:           serviceName ?? '',
      instructor_name: instructorName ?? '',
      start_time:      s.startTime,
      end_time:        s.endTime,
      capacity:        capacity ?? 10,
      status:          'CONFIRMED',
    }))

    // Skip rows that already exist (avoids needing a unique index for upsert)
    const startTimes = rows.map(r => r.start_time)
    const { data: existing } = await supabase
      .from('sessions')
      .select('start_time')
      .eq('service_id', serviceId)
      .in('start_time', startTimes)
    const existingTimes = new Set((existing ?? []).map((e: { start_time: string }) => e.start_time))
    const newRows = rows.filter(r => !existingTimes.has(r.start_time))

    if (newRows.length === 0) {
      return NextResponse.json({ ids: [], count: 0, skipped: rows.length })
    }

    const { data, error } = await supabase
      .from('sessions')
      .insert(newRows)
      .select('id')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    revalidatePath('/admin/schedule')
    revalidatePath('/admin/classes')
    revalidatePath('/admin/checkin')
    revalidatePath('/classes')
    return NextResponse.json({ ids: data.map((r: { id: string }) => r.id), count: data.length, skipped: rows.length - data.length })
  }

  // Single session insert
  if (!startTime || !endTime) {
    return NextResponse.json({ error: 'startTime and endTime required' }, { status: 400 })
  }
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      service_id:      serviceId,
      title:           serviceName ?? '',
      instructor_name: instructorName ?? '',
      start_time:      startTime,
      end_time:        endTime,
      capacity:        capacity ?? 10,
      status:          'CONFIRMED',
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePath('/admin/schedule')
  revalidatePath('/admin/classes')
  revalidatePath('/admin/checkin')
  revalidatePath('/classes')

  return NextResponse.json({ id: data.id })
}

function melbTimeParts(iso: string) {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Melbourne',
    weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date(iso))
  return {
    dow:    parts.find(p => p.type === 'weekday')?.value ?? '',
    hour:   parseInt(parts.find(p => p.type === 'hour')?.value   ?? '0'),
    minute: parseInt(parts.find(p => p.type === 'minute')?.value ?? '0'),
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, instructorName, startTime, endTime, capacity, applyToFuture } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // Fetch original session so we can compute deltas and find sibling sessions
  const { data: orig, error: origErr } = await supabase
    .from('sessions')
    .select('id, start_time, end_time, service_id')
    .eq('id', id)
    .single()
  if (origErr || !orig) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  // Time delta in minutes (applied to every matched session so Melbourne wall-clock shifts uniformly)
  let deltaMs = 0
  let newDurationMs: number | null = null
  if (startTime) {
    const [oh, om] = [melbTimeParts(orig.start_time).hour, melbTimeParts(orig.start_time).minute]
    const [nh, nm] = (startTime as string).split(':').map(Number)
    deltaMs = ((nh * 60 + nm) - (oh * 60 + om)) * 60000
    if (endTime) {
      const [eh, em] = (endTime as string).split(':').map(Number)
      newDurationMs = ((eh * 60 + em) - (nh * 60 + nm)) * 60000
    }
  }

  function shiftTimes(s: { start_time: string; end_time: string }) {
    const origDur  = new Date(s.end_time).getTime() - new Date(s.start_time).getTime()
    const newStart = new Date(new Date(s.start_time).getTime() + deltaMs).toISOString()
    const newEnd   = new Date(new Date(s.start_time).getTime() + deltaMs + (newDurationMs ?? origDur)).toISOString()
    return { start_time: newStart, end_time: newEnd }
  }

  const basePatch: Record<string, unknown> = {}
  if (instructorName !== undefined) basePatch.instructor_name = instructorName
  if (typeof capacity === 'number' && capacity > 0) basePatch.capacity = capacity

  if (applyToFuture) {
    const { data: future } = await supabase
      .from('sessions')
      .select('id, start_time, end_time')
      .eq('service_id', orig.service_id)
      .gte('start_time', new Date().toISOString())
      .neq('status', 'CANCELLED')

    const origParts = melbTimeParts(orig.start_time)
    const matching = (future ?? []).filter(s => {
      const p = melbTimeParts(s.start_time)
      return p.dow === origParts.dow && p.hour === origParts.hour && p.minute === origParts.minute
    })

    for (const s of matching) {
      const update: Record<string, unknown> = { ...basePatch }
      if (startTime) Object.assign(update, shiftTimes(s))
      if (Object.keys(update).length > 0) {
        const { error } = await supabase.from('sessions').update(update).eq('id', s.id)
        if (error) console.error('Session update error:', s.id, error.message)
      }
    }

    revalidatePath('/admin/schedule')
    revalidatePath('/admin/classes')
    revalidatePath('/admin/checkin')
    revalidatePath('/classes')
    return NextResponse.json({ ok: true, updated: matching.length })
  }

  // Single-session update
  const update: Record<string, unknown> = { ...basePatch }
  if (startTime) Object.assign(update, shiftTimes(orig))
  if (Object.keys(update).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })

  const { error } = await supabase.from('sessions').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePath('/admin/schedule')
  revalidatePath('/admin/classes')
  revalidatePath('/admin/checkin')
  revalidatePath('/classes')
  return NextResponse.json({ ok: true, updated: 1 })
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // Block deletion if confirmed bookings exist — cancel the session instead
  const { count: bookedCount } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', id)
    .eq('status', 'CONFIRMED')

  if (bookedCount && bookedCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${bookedCount} confirmed booking${bookedCount !== 1 ? 's' : ''} exist. Cancel the session first to notify members and restore credits.` },
      { status: 409 },
    )
  }

  const { error } = await supabase.from('sessions').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePath('/admin/schedule')
  revalidatePath('/admin/classes')
  revalidatePath('/admin/checkin')
  revalidatePath('/classes')

  return NextResponse.json({ ok: true })
}
