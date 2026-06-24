import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export const maxDuration = 30
import { signupPlans, RECURRING_PLAN_BILLING } from '@/lib/content'
import { getMemberByEmail, getMemberByStripeCustomerId, updateMemberCredential, getMemberById, upsertMembership, CREDIT_PLANS, recordStripeEvent } from '@/lib/db'

const stripe = new Stripe(
  (process.env.STRIPE_SECRET_KEY ?? '').replace(/\\n|\n/g, '').trim(),
  { apiVersion: '2024-04-10' as never }
)
const STRIPE_WEBHOOK_SECRET = (process.env.STRIPE_WEBHOOK_SECRET ?? '').replace(/\\n|\n/g, '').trim()

async function sendEmail(to: string, template: string, vars: Record<string, string>) {
  const base = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bodyforme.com.au').replace(/\\n|\n/g, '').trim()
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
  const BASE_URL     = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bodyforme.com.au').replace(/\\n|\n/g, '').trim()

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
          sendEmail(STUDIO_EMAIL, 'custom', {
            subject: `Direct debit set up — ${member.firstName} ${member.lastName}`,
            html: `<p>${member.firstName} ${member.lastName} (${member.email}) has completed their BECS direct debit setup. Their bank details are now saved in Stripe.</p>`,
          }).catch(() => {})
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
      // customer_email is null when checkout was created with an existing customer ID
      // (all in-app purchases for members who already have a Stripe customer).
      // Fall back to customer_details.email (always present after checkout completes),
      // then to meta.memberId for the member_app flow.
      const checkoutDetails  = (obj.customer_details as Record<string, string> | null)
      const email     = (obj.customer_email as string) || checkoutDetails?.email || ''
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

      // Look up member: prefer memberId from metadata (member_app flow),
      // fall back to email (public sign-up flow).
      const stripeCustomerId = (obj.customer as string) ?? ''
      const memberId = meta.memberId ?? ''
      let member = memberId ? await getMemberById(memberId) : null
      if (!member && email) member = await getMemberByEmail(email)

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

      const isRenewal = meta.source === 'member_app'

      // Skip welcome email for renewals (member already has an account)
      if (email && firstName && planKey !== 'free-trial' && !isRenewal) {
        sendEmail(email, 'welcome', { firstName }).catch(() => {})
      }

      sendEmail(STUDIO_EMAIL, 'custom', {
        subject: isRenewal
          ? `Membership renewed — ${fullName || email} (${planName})`
          : `New sign-up — ${fullName || email} (${planName})`,
        html: isRenewal
          ? `<h2>Membership Renewed via Member App</h2><table cellpadding="6"><tr><td><strong>Name</strong></td><td>${fullName}</td></tr><tr><td><strong>Email</strong></td><td>${email}</td></tr><tr><td><strong>Plan</strong></td><td>${planName}</td></tr></table>`
          : `<h2>New Sign-Up via Stripe Checkout</h2><table cellpadding="6"><tr><td><strong>Name</strong></td><td>${fullName}</td></tr><tr><td><strong>Email</strong></td><td>${email}</td></tr><tr><td><strong>Plan</strong></td><td>${planName}</td></tr><tr><td><strong>Phone</strong></td><td>${meta.phone ?? ''}</td></tr><tr><td><strong>Address</strong></td><td>${[meta.address, meta.suburb, meta.state, meta.postcode].filter(Boolean).join(', ')}</td></tr></table>`,
      }).catch(() => {})
      break
    }

    case 'invoice.paid': {
      // Recurring subscription renewed — keep end date and status fresh in DB
      const inv = event.data.object as {
        customer:           string
        subscription:       string
        billing_reason:     string
        collection_method:  string
        lines: { data: { period: { end: number }; price: { nickname: string | null } }[] }
      }
      const renewedCustomerId = inv.customer
      if (!renewedCustomerId) break

      // After the client pays the first invoice (sent_invoice flow), switch to
      // charge_automatically so all future renewals are silent direct debits.
      if (inv.billing_reason === 'subscription_create' && inv.collection_method === 'send_invoice' && inv.subscription) {
        await stripe.subscriptions.update(inv.subscription, {
          collection_method: 'charge_automatically',
        }).catch(e => console.error('[invoice.paid] switch to charge_automatically failed:', e))
      }

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
        sendEmail(email, 'payment-failed', { firstName, planName }).catch(() => {})
      }

      // Alert studio so they can follow up
      sendEmail(STUDIO_EMAIL, 'custom', {
        subject: `Payment failed — ${firstName || email}`,
        html: `<p>A membership payment failed for <strong>${firstName || email}</strong> (${email}).</p><p>Plan: ${planName}</p><p>Their status has been set to <strong>past_due</strong>. Please follow up in Stripe and contact the member.</p>`,
      }).catch(() => {})
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
      const customerId    = si.customer
      const paymentMethod = si.payment_method
      const memberId      = si.metadata?.memberId ?? ''

      if (customerId && paymentMethod) {
        await stripe.customers.update(customerId, {
          invoice_settings: { default_payment_method: paymentMethod },
        })
      }

      const member = memberId
        ? await getMemberById(memberId)
        : customerId ? await getMemberByStripeCustomerId(customerId) : null

      // Auto-create subscription if member has a known recurring plan and no active sub yet
      if (member && customerId && paymentMethod && member.planOverride) {
        const billing = RECURRING_PLAN_BILLING[member.planOverride.toLowerCase()]
        if (billing) {
          const existing = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 })
          if (!existing.data.length) {
            try {
              // subscriptions.create price_data needs an existing product ID
              const productList = await stripe.products.list({ active: true, limit: 100 })
              let becsProduct = productList.data.find(p => p.name === member.planOverride)
              if (!becsProduct) {
                becsProduct = await stripe.products.create({ name: member.planOverride })
              }
              const sub = await stripe.subscriptions.create({
                customer:               customerId,
                default_payment_method: paymentMethod,
                collection_method:      'charge_automatically',
                items: [{
                  price_data: {
                    currency:    'aud',
                    product:     becsProduct.id,
                    unit_amount: billing.amount,
                    recurring:   { interval: billing.interval },
                  } as any,
                }],
                metadata: { memberId: member._id, source: 'auto_becs' },
              })
              const periodEnd = (sub as any).current_period_end
              const endDate   = periodEnd ? new Date(periodEnd * 1000).toISOString().slice(0, 10) : undefined
              await updateMemberCredential(member._id, {
                status: 'active',
                ...(endDate ? { membershipEndDate: endDate, nextBillingDate: endDate } : {}),
              })
              await upsertMembership({
                memberId:  member._id,
                planName:  member.planOverride,
                status:    'ACTIVE',
                startDate: new Date().toISOString().slice(0, 10),
                endDate:   endDate ?? '',
              })
            } catch (err) {
              console.error('[setup_intent.succeeded] auto-subscription failed:', err)
            }
          }
        }
      }

      if (member) {
        sendEmail(STUDIO_EMAIL, 'custom', {
          subject: `Direct debit set up — ${member.firstName} ${member.lastName}`,
          html: `<p>${member.firstName} ${member.lastName} (${member.email}) has completed their BECS direct debit setup. Their bank details are now saved in Stripe as the default payment method.</p>`,
        }).catch(() => {})
      }
      break
    }

    case 'customer.subscription.created': {
      // New subscription — set billing dates immediately so admin sees them
      // (invoice.paid won't fire for 2-3 days for BECS; this fills the gap)
      const sub = event.data.object as {
        customer:             string
        status:               string
        current_period_end:   number
        current_period_start: number
        metadata:             Record<string, string>
        items: { data: { price: { id: string; nickname: string | null } }[] }
      }
      const newSubCustomerId = sub.customer
      if (!newSubCustomerId) break

      const newSubMember = await getMemberByStripeCustomerId(newSubCustomerId)
      if (!newSubMember) break

      const newSubPeriodEnd = sub.current_period_end
      const newSubEndDate   = newSubPeriodEnd
        ? new Date(newSubPeriodEnd * 1000).toISOString().slice(0, 10)
        : undefined
      const newSubStartDate = sub.current_period_start
        ? new Date(sub.current_period_start * 1000).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10)

      // Resolve plan name: price nickname → product name → metadata planKey → planOverride
      const newSubPriceId = sub.items?.data?.[0]?.price?.id ?? ''
      let   newSubPlanName = sub.items?.data?.[0]?.price?.nickname ?? ''
      if (!newSubPlanName && newSubPriceId) {
        try {
          const price = await stripe.prices.retrieve(newSubPriceId, { expand: ['product'] }) as Stripe.Price & { product: Stripe.Product }
          newSubPlanName = price.nickname ?? (price.product as Stripe.Product)?.name ?? ''
        } catch { /* keep empty */ }
      }
      if (!newSubPlanName) {
        const mk = sub.metadata?.planKey ?? sub.metadata?.plan ?? ''
        newSubPlanName = (mk && signupPlans[mk]?.name) ? signupPlans[mk].name : newSubMember.planOverride ?? ''
      }

      await updateMemberCredential(newSubMember._id, {
        status: 'active',
        // Set planOverride here so member's plan name is correct even if
        // checkout.session.completed couldn't resolve it (e.g. customer_email was null)
        ...(newSubPlanName ? { planOverride: newSubPlanName } : {}),
        ...(newSubEndDate ? { membershipEndDate: newSubEndDate, nextBillingDate: newSubEndDate } : {}),
      })

      await upsertMembership({
        memberId:  newSubMember._id,
        planName:  newSubPlanName,
        status:    'ACTIVE',
        startDate: newSubStartDate,
        endDate:   newSubEndDate ?? '',
      })
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
