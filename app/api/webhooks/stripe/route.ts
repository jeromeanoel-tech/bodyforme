import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { signupPlans } from '@/lib/content'
import { getMemberByEmail, getMemberByStripeCustomerId, updateMemberCredential, getMemberById, upsertMembership, CREDIT_PLANS, recordStripeEvent } from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' as never })
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!

async function sendEmail(to: string, template: string, vars: Record<string, string>) {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bodyforme.com.au'
  await fetch(`${base}/api/email/send`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'x-internal-key': process.env.INTERNAL_EMAIL_KEY ?? process.env.STRIPE_WEBHOOK_SECRET ?? '',
    },
    body: JSON.stringify({ to, template, vars }),
  })
}

export async function POST(req: NextRequest) {
  const payload   = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Idempotency — skip events we've already processed (guards against Stripe retries)
  const isNew = await recordStripeEvent(event.id)
  if (!isNew) return NextResponse.json({ received: true })

  const obj = event.data.object as Record<string, unknown>

  const STUDIO_EMAIL = process.env.STUDIO_EMAIL ?? 'info@bodyforme.com.au'
  const BASE_URL     = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bodyforme.com.au'

  switch (event.type) {
    case 'checkout.session.completed': {
      const meta = (obj.metadata ?? {}) as Record<string, string>

      // ── BECS direct debit setup ───────────────────────────────────────────
      if (obj.mode === 'setup') {
        const memberId         = meta.memberId ?? ''
        const stripeCustomerId = (obj.customer as string) ?? ''
        if (memberId && stripeCustomerId) {
          await updateMemberCredential(memberId, { stripeCustomerId })
        }
        // Notify studio that a member has set up their debit
        const member = memberId ? await getMemberById(memberId) : null
        if (member) {
          await sendEmail(STUDIO_EMAIL, 'custom', {
            subject: `Direct debit set up — ${member.firstName} ${member.lastName}`,
            html: `<p>${member.firstName} ${member.lastName} (${member.email}) has completed their BECS direct debit setup. Their bank details are now saved in Stripe.</p>`,
          })
        }
        break
      }

      // ── POS sale ──────────────────────────────────────────────────────────
      if (meta.source === 'pos') {
        const memberId = meta.memberId ?? ''
        const actions: { memberAction: string; creditAmount: number; planName: string; quantity: number }[] =
          JSON.parse(meta.actions ?? '[]')

        if (memberId) {
          const member = await getMemberById(memberId)
          if (member) {
            let newCreditBalance = member.creditBalance
            let newPlanOverride  = member.planOverride
            let newStatus        = member.status ?? 'active'
            let setPlanName: string | null = null

            for (const action of actions) {
              if (action.memberAction === 'add_credits') {
                newCreditBalance += (action.creditAmount ?? 0) * (action.quantity ?? 1)
              } else if (action.memberAction === 'set_plan') {
                newPlanOverride = action.planName
                newStatus       = 'active'
                setPlanName     = action.planName
              }
            }

            await updateMemberCredential(memberId, {
              creditBalance: newCreditBalance,
              planOverride:  newPlanOverride,
              status:        newStatus,
            })

            // Sync memberships table so Admin > Memberships shows this plan
            if (setPlanName) {
              await upsertMembership({
                memberId,
                planName:  setPlanName,
                status:    'ACTIVE',
                startDate: new Date().toISOString().slice(0, 10),
                endDate:   '',
              })
            }
          }
        }
        break
      }

      // ── Standard sign-up checkout ─────────────────────────────────────────
      const email     = (obj.customer_email as string) ?? ''
      const firstName = meta.firstName ?? ''
      const lastName  = meta.lastName  ?? ''
      const planKey   = meta.plan ?? ''
      const planName  = signupPlans[planKey]?.name ?? planKey
      const fullName  = `${firstName} ${lastName}`.trim()

      // Credits to seed for one-time class packs
      const PLAN_CREDITS: Record<string, number> = {
        'casual': 1,
        '10pack': 10, '20pack': 20, '50pack': 50,
      }
      const creditSeed = PLAN_CREDITS[planKey] ?? 0

      // End date for prepaid plans (months, or 7 days for intro-offer)
      const PLAN_MONTHS: Record<string, number> = { '3month': 3, '6month': 6, '12month': 12 }
      const prepaidMonths = PLAN_MONTHS[planKey]
      let membershipEndDate: string | undefined
      if (prepaidMonths) {
        const d = new Date()
        d.setMonth(d.getMonth() + prepaidMonths)
        membershipEndDate = d.toISOString().slice(0, 10)
      } else if (planKey === 'intro-offer') {
        const d = new Date()
        d.setDate(d.getDate() + 7)
        membershipEndDate = d.toISOString().slice(0, 10)
      }

      // Activate member account and set plan
      if (email) {
        const stripeCustomerId = (obj.customer as string) ?? ''
        const member = await getMemberByEmail(email)
        if (member) {
          await updateMemberCredential(member._id, {
            status:             'active',
            stripeCustomerId,
            planOverride:       planName,
            creditBalance:      creditSeed > 0 ? creditSeed : member.creditBalance,
            ...(membershipEndDate ? { membershipEndDate } : {}),
          })

          // Sync memberships table — only for recurring plans, not packs/casual
          const today = new Date().toISOString().slice(0, 10)
          const isPack = CREDIT_PLANS.some(p => planName.toLowerCase().includes(p.toLowerCase()))
          if (!isPack) {
            await upsertMembership({
              memberId:  member._id,
              planName,
              status:    'ACTIVE',
              startDate: today,
              endDate:   membershipEndDate ?? '',
            })
          }
        }

      }

      // Send welcome email — skip free-trial (they already got a confirmation from the free-trial-signup route)
      if (email && firstName && planKey !== 'free-trial') {
        await sendEmail(email, 'welcome', { firstName }).catch(() => {})
      }

      await sendEmail(STUDIO_EMAIL, 'custom', {
        subject: `New sign-up — ${fullName || email} (${planName})`,
        html: `
          <h2>New Sign-Up via Stripe Checkout</h2>
          <table cellpadding="6">
            <tr><td><strong>Name</strong></td><td>${fullName}</td></tr>
            <tr><td><strong>Email</strong></td><td>${email}</td></tr>
            <tr><td><strong>Plan</strong></td><td>${planName}</td></tr>
            <tr><td><strong>Phone</strong></td><td>${meta.phone ?? ''}</td></tr>
            <tr><td><strong>Address</strong></td><td>${[meta.address, meta.suburb, meta.state, meta.postcode].filter(Boolean).join(', ')}</td></tr>
          </table>
        `,
      })
      break
    }

    case 'invoice.paid': {
      // Recurring subscription renewed — keep end date and status fresh in DB
      const inv = event.data.object as {
        customer: string
        lines: { data: { period: { end: number }; price: { nickname: string | null } }[] }
      }
      const renewedCustomerId = inv.customer
      if (!renewedCustomerId) break

      const renewedMember = await getMemberByStripeCustomerId(renewedCustomerId)
      if (!renewedMember) break

      const periodEnd   = inv.lines?.data?.[0]?.period?.end
      const newEndDate  = periodEnd
        ? new Date(periodEnd * 1000).toISOString().slice(0, 10)
        : undefined

      const nextBill    = periodEnd
        ? new Date(periodEnd * 1000).toISOString().slice(0, 10)
        : undefined

      await updateMemberCredential(renewedMember._id, {
        status: 'active',
        ...(newEndDate ? { membershipEndDate: newEndDate } : {}),
        ...(nextBill  ? { nextBillingDate:   nextBill }  : {}),
      })

      // Keep memberships table end date in sync
      const renewedPlan = inv.lines?.data?.[0]?.price?.nickname ?? renewedMember.planOverride ?? ''
      await upsertMembership({
        memberId:  renewedMember._id,
        planName:  renewedPlan,
        status:    'ACTIVE',
        startDate: '',
        endDate:   newEndDate ?? '',
      })
      break
    }

    case 'invoice.payment_failed': {
      const inv = event.data.object as {
        customer: string
        customer_email: string
        customer_name: string
        lines: { data: { description: string }[] }
      }
      const email     = inv.customer_email ?? ''
      const firstName = inv.customer_name?.split(' ')[0] ?? ''
      const planName  = inv.lines?.data?.[0]?.description ?? 'membership'

      // Mark member past_due in DB so admin can see it
      if (inv.customer) {
        const failedMember = await getMemberByStripeCustomerId(inv.customer)
        if (failedMember) {
          await updateMemberCredential(failedMember._id, { status: 'past_due' })
        }
      }

      // Notify member
      if (email) {
        await sendEmail(email, 'payment-failed', { firstName, planName })
      }

      // Alert studio so they can follow up
      await sendEmail(STUDIO_EMAIL, 'custom', {
        subject: `Payment failed — ${firstName || email}`,
        html: `<p>A membership payment failed for <strong>${firstName || email}</strong> (${email}).</p><p>Plan: ${planName}</p><p>Their status has been set to <strong>past_due</strong>. Please follow up in Stripe and contact the member.</p>`,
      })
      break
    }

    case 'payment_intent.succeeded': {
      // Terminal (in-person reader) POS payments
      const meta = (obj.metadata ?? {}) as Record<string, string>
      if (meta.source !== 'pos_terminal') break

      const memberId = meta.memberId ?? ''
      if (!memberId) break

      const actions: { memberAction: string; creditAmount: number; planName: string; quantity: number }[] =
        JSON.parse(meta.actions ?? '[]')

      const member = await getMemberById(memberId)
      if (!member) break

      let newCreditBalance = member.creditBalance
      let newPlanOverride  = member.planOverride
      let newStatus        = member.status ?? 'active'

      let terminalSetPlan: string | null = null
      for (const action of actions) {
        if (action.memberAction === 'add_credits') {
          newCreditBalance += (action.creditAmount ?? 0) * (action.quantity ?? 1)
        } else if (action.memberAction === 'set_plan') {
          newPlanOverride  = action.planName
          newStatus        = 'active'
          terminalSetPlan  = action.planName
        }
      }

      await updateMemberCredential(memberId, {
        creditBalance: newCreditBalance,
        planOverride:  newPlanOverride,
        status:        newStatus,
      })

      // Sync memberships table so Admin > Memberships shows this plan
      if (terminalSetPlan) {
        await upsertMembership({
          memberId,
          planName:  terminalSetPlan,
          status:    'ACTIVE',
          startDate: new Date().toISOString().slice(0, 10),
          endDate:   '',
        })
      }
      break
    }

    case 'setup_intent.succeeded': {
      const si = event.data.object as { customer: string; payment_method: string; metadata: Record<string, string> }
      const customerId     = si.customer
      const paymentMethod  = si.payment_method
      const memberId       = si.metadata?.memberId ?? ''
      if (customerId && paymentMethod) {
        await stripe.customers.update(customerId, {
          invoice_settings: { default_payment_method: paymentMethod },
        })
      }
      if (memberId) {
        const member = await getMemberById(memberId)
        if (member) {
          await sendEmail(STUDIO_EMAIL, 'custom', {
            subject: `Direct debit set up — ${member.firstName} ${member.lastName}`,
            html: `<p>${member.firstName} ${member.lastName} (${member.email}) has completed their BECS direct debit setup. Their bank details are now saved in Stripe as the default payment method.</p>`,
          })
        }
      }
      break
    }

    case 'customer.subscription.updated': {
      // Sync plan/status changes made via Stripe Portal (upgrade, downgrade, pause, resume)
      const sub = event.data.object as {
        id: string
        customer: string
        status: string
        current_period_end: number
        items: { data: { price: { id: string; nickname: string | null } }[] }
        pause_collection: { behavior: string } | null
      }
      const updatedCustomerId = sub.customer
      if (!updatedCustomerId) break

      const member = await getMemberByStripeCustomerId(updatedCustomerId)
      if (!member) break

      const stripeStatus = sub.status
      const isPaused     = !!sub.pause_collection
      const priceId      = sub.items?.data?.[0]?.price?.id ?? ''
      let   planNickname = sub.items?.data?.[0]?.price?.nickname ?? ''

      // Fall back to product name if price has no nickname
      if (!planNickname && priceId) {
        try {
          const price = await stripe.prices.retrieve(priceId, { expand: ['product'] }) as Stripe.Price & { product: Stripe.Product }
          planNickname = price.nickname ?? (price.product as Stripe.Product)?.name ?? ''
        } catch { /* keep planNickname empty */ }
      }

      const newEndDate = sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString().slice(0, 10)
        : undefined

      let newStatus: string = member.status ?? 'active'
      if (stripeStatus === 'active' && !isPaused) newStatus = 'active'
      else if (isPaused)                           newStatus = 'paused'
      else if (stripeStatus === 'past_due')        newStatus = 'past_due'
      else if (stripeStatus === 'canceled')        newStatus = 'inactive'

      await updateMemberCredential(member._id, {
        status: newStatus,
        ...(planNickname ? { planOverride: planNickname } : {}),
        ...(newEndDate   ? { membershipEndDate: newEndDate, nextBillingDate: newEndDate } : {}),
      })

      await upsertMembership({
        memberId:  member._id,
        planName:  planNickname || member.planOverride || '',
        status:    stripeStatus === 'canceled' ? 'CANCELED' : 'ACTIVE',
        startDate: '',
        endDate:   newEndDate ?? '',
      })
      break
    }

    case 'customer.subscription.deleted': {
      // Weekly subscription cancelled — look up member by Stripe customer ID and deactivate
      const cancelledCustomerId = (obj.customer as string) ?? ''
      if (cancelledCustomerId) {
        const member = await getMemberByStripeCustomerId(cancelledCustomerId)
        if (member) {
          await updateMemberCredential(member._id, { status: 'inactive', planOverride: '' })
          // Sync the memberships table so admin Memberships panel shows correct status
          await upsertMembership({
            memberId:  member._id,
            planName:  member.planOverride ?? '',
            status:    'CANCELED',
            startDate: '',
            endDate:   '',
          })
        }
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
