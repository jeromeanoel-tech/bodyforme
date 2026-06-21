// Fire-and-forget broadcast to all connected member app clients via Supabase Realtime.
// Uses the REST broadcast endpoint — no WebSocket / persistent connection needed.
async function send(event: string, payload: Record<string, unknown>) {
  const url  = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/realtime/v1/api/broadcast`
  const key  = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  const auth = process.env.SUPABASE_SECRET_KEY!
  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${auth}`,
        'apikey':        key,
      },
      body: JSON.stringify({
        messages: [{ topic: 'realtime:schedule-updates', event, payload }],
      }),
    })
  } catch { /* non-critical — UI falls back to polling */ }
}

export function broadcastBookingChanged(sessionId: string, delta: number) {
  return send('booking-changed', { sessionId, delta })
}

export function broadcastSessionCancelled(sessionId: string) {
  return send('session-cancelled', { sessionId })
}
