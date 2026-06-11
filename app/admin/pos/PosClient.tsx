'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import type { PosProduct } from '@/app/api/admin/pos/products/route'
import type { CheckoutItem } from '@/app/api/admin/pos/checkout/route'

type Member = {
  id:            string
  firstName:     string
  lastName:      string
  email:         string
  planOverride:  string
  creditBalance: number
  status:        string
}

type CartItem = PosProduct & { quantity: number }

type TerminalStatus =
  | 'idle'
  | 'connecting'
  | 'waiting_card'
  | 'processing'
  | 'success'
  | 'error'

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2).replace('.00', '')}`
}

export default function PosClient() {
  const params   = useSearchParams()
  const justPaid = params.get('success') === '1'

  const [products, setProducts]               = useState<PosProduct[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [cart, setCart]                       = useState<CartItem[]>([])
  const [memberQuery, setMemberQuery]         = useState('')
  const [memberResults, setMemberResults]     = useState<Member[]>([])
  const [selectedMember, setSelectedMember]   = useState<Member | null>(null)
  const [searchOpen, setSearchOpen]           = useState(false)
  const [charging, setCharging]               = useState(false)
  const [paymentUrl, setPaymentUrl]           = useState<string | null>(null)
  const [copied, setCopied]                   = useState(false)
  const [successBanner, setSuccessBanner]     = useState(justPaid)

  // Terminal state
  const [terminalStatus, setTerminalStatus] = useState<TerminalStatus>('idle')
  const [terminalError, setTerminalError]   = useState<string | null>(null)
  const [readerName, setReaderName]         = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const terminalRef = useRef<any>(null)

  const searchRef   = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load products from Stripe
  useEffect(() => {
    fetch('/api/admin/pos/products')
      .then(r => r.json())
      .then(d => { setProducts(d.products ?? []); setProductsLoading(false) })
      .catch(() => setProductsLoading(false))
  }, [])

  // Dismiss success banner after 4 s
  useEffect(() => {
    if (!successBanner) return
    const t = setTimeout(() => setSuccessBanner(false), 4000)
    return () => clearTimeout(t)
  }, [successBanner])

  // Auto-clear after terminal success
  useEffect(() => {
    if (terminalStatus !== 'success') return
    const t = setTimeout(() => {
      setTerminalStatus('idle')
      setCart([])
      setSelectedMember(null)
      setMemberQuery('')
      setPaymentUrl(null)
      setSuccessBanner(true)
    }, 3000)
    return () => clearTimeout(t)
  }, [terminalStatus])

  // Member search debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (memberQuery.length < 2) { setMemberResults([]); return }
    debounceRef.current = setTimeout(() => {
      fetch(`/api/admin/search-members?q=${encodeURIComponent(memberQuery)}`)
        .then(r => r.json())
        .then(d => setMemberResults(d.members ?? []))
    }, 250)
  }, [memberQuery])

  // Close search dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function addToCart(p: PosProduct) {
    setCart(c => {
      const existing = c.find(i => i.id === p.id)
      if (existing) return c.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...c, { ...p, quantity: 1 }]
    })
  }

  function removeFromCart(id: string) {
    setCart(c => c.filter(i => i.id !== id))
  }

  function updateQty(id: string, qty: number) {
    if (qty < 1) { removeFromCart(id); return }
    setCart(c => c.map(i => i.id === id ? { ...i, quantity: qty } : i))
  }

  function clearCart() {
    setCart([])
    setSelectedMember(null)
    setMemberQuery('')
    setPaymentUrl(null)
  }

  const total = cart.reduce((sum, i) => sum + i.amount * i.quantity, 0)

  // ── Online payment link ──────────────────────────────────────────────────
  async function handleCharge() {
    if (!cart.length) return
    setCharging(true)
    try {
      const items: CheckoutItem[] = cart.map(i => ({
        priceId:      i.priceId,
        quantity:     i.quantity,
        memberAction: i.memberAction,
        creditAmount: i.creditAmount,
        planName:     i.planName,
      }))
      const res = await fetch('/api/admin/pos/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          memberId:    selectedMember?.id    ?? '',
          memberEmail: selectedMember?.email ?? '',
          memberName:  selectedMember ? `${selectedMember.firstName} ${selectedMember.lastName}` : '',
          items,
        }),
      })
      const data = await res.json()
      if (data.url) setPaymentUrl(data.url)
    } finally {
      setCharging(false)
    }
  }

  // ── Terminal (reader) charge ─────────────────────────────────────────────
  async function handleTerminalCharge() {
    if (!cart.length) return
    setTerminalError(null)
    setTerminalStatus('connecting')

    try {
      // Lazy-load Terminal SDK once per session
      if (!terminalRef.current) {
        const { loadStripeTerminal } = await import('@stripe/terminal-js')
        const StripeTerminal = await loadStripeTerminal()
        if (!StripeTerminal) {
          setTerminalStatus('error')
          setTerminalError('Failed to load Stripe Terminal. Check your internet connection.')
          return
        }
        terminalRef.current = StripeTerminal.create({
          onFetchConnectionToken: async () => {
            const r = await fetch('/api/admin/pos/terminal-connection-token', { method: 'POST' })
            const d = await r.json()
            return d.secret as string
          },
          onUnexpectedReaderDisconnect: () => {
            setReaderName(null)
            setTerminalStatus('error')
            setTerminalError('Reader disconnected. Make sure it\'s powered on and connected to Wi-Fi.')
          },
        })
      }

      const terminal = terminalRef.current

      // Connect to reader if not already connected
      const connected = terminal.getConnectedReader()
      if (!connected) {
        const discover = await terminal.discoverReaders({ simulated: false })
        if (discover.error) {
          setTerminalStatus('error')
          setTerminalError(discover.error.message ?? 'Could not search for readers.')
          return
        }
        if (!discover.discoveredReaders?.length) {
          setTerminalStatus('error')
          setTerminalError('No reader found. Make sure the reader is powered on and connected to Wi-Fi.')
          return
        }
        const connectResult = await terminal.connectReader(discover.discoveredReaders[0])
        if (connectResult.error) {
          setTerminalStatus('error')
          setTerminalError(connectResult.error.message ?? 'Could not connect to reader.')
          return
        }
        setReaderName(connectResult.reader?.label ?? connectResult.reader?.id ?? 'Reader')
      } else {
        setReaderName(connected.label ?? connected.id ?? 'Reader')
      }

      // Build actions payload (same shape as checkout route)
      const actions = cart.map(i => ({
        memberAction: i.memberAction,
        creditAmount: i.creditAmount,
        planName:     i.planName,
        quantity:     i.quantity,
      }))

      // Create PaymentIntent on the server
      const piRes = await fetch('/api/admin/pos/terminal-payment', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          amount:     total,
          memberId:   selectedMember?.id    ?? '',
          memberName: selectedMember ? `${selectedMember.firstName} ${selectedMember.lastName}` : '',
          actions,
        }),
      })
      const piData = await piRes.json()
      if (!piData.clientSecret) {
        setTerminalStatus('error')
        setTerminalError(piData.error ?? 'Failed to create payment.')
        return
      }

      // Present card to reader
      setTerminalStatus('waiting_card')
      const collectResult = await terminal.collectPaymentMethod(piData.clientSecret)
      if (collectResult.error) {
        setTerminalStatus('error')
        setTerminalError(collectResult.error.message ?? 'Card collection cancelled.')
        return
      }

      // Process
      setTerminalStatus('processing')
      const processResult = await terminal.processPayment(collectResult.paymentIntent)
      if (processResult.error) {
        setTerminalStatus('error')
        setTerminalError(processResult.error.message ?? 'Payment failed. Please try again.')
        return
      }

      setTerminalStatus('success')
    } catch (err: unknown) {
      setTerminalStatus('error')
      setTerminalError(err instanceof Error ? err.message : 'Unexpected error.')
    }
  }

  async function copyLink() {
    if (!paymentUrl) return
    await navigator.clipboard.writeText(paymentUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const terminalBusy = terminalStatus === 'connecting' || terminalStatus === 'waiting_card' || terminalStatus === 'processing'

  return (
    <div className="h-full flex flex-col overflow-hidden bg-neutral-50">

      {/* Success banner */}
      {successBanner && (
        <div className="shrink-0 bg-emerald-600 text-white text-[13px] font-medium px-6 py-2.5 flex items-center justify-between">
          <span>Payment received — member record updated.</span>
          <button onClick={() => setSuccessBanner(false)} className="text-white/70 hover:text-white">✕</button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">

        {/* ── Left: products ── */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-neutral-200 bg-white">
          <div className="shrink-0 px-6 py-4 border-b border-neutral-100">
            <h2 className="text-[15px] font-semibold text-neutral-900">Products</h2>
            <p className="text-[12px] text-neutral-400 mt-0.5">Managed via Stripe dashboard</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {productsLoading ? (
              <p className="text-sm text-neutral-400 px-2 py-8">Loading products…</p>
            ) : products.length === 0 ? (
              <p className="text-sm text-neutral-400 px-2 py-8">No POS products found in Stripe.</p>
            ) : (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                {products.map(p => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="text-left p-4 rounded-xl border border-neutral-200 bg-white hover:border-black hover:shadow-sm transition-all group"
                  >
                    <p className="text-[13px] font-semibold text-neutral-900 group-hover:text-black mb-1">{p.name}</p>
                    {p.description && (
                      <p className="text-[11px] text-neutral-400 mb-3 line-clamp-2">{p.description}</p>
                    )}
                    <p className="text-[16px] font-bold text-neutral-900">{fmt(p.amount)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: client + cart ── */}
        <div className="w-80 shrink-0 flex flex-col bg-white overflow-hidden">

          {/* Client selector */}
          <div className="shrink-0 px-4 py-4 border-b border-neutral-100">
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">Client</p>
            {selectedMember ? (
              <div className="flex items-center justify-between bg-neutral-50 rounded-lg px-3 py-2.5">
                <div>
                  <p className="text-[13px] font-medium text-neutral-900">
                    {selectedMember.firstName} {selectedMember.lastName}
                  </p>
                  <p className="text-[11px] text-neutral-400">{selectedMember.email}</p>
                </div>
                <button
                  onClick={() => { setSelectedMember(null); setMemberQuery('') }}
                  className="text-neutral-400 hover:text-black text-[11px] ml-2"
                >✕</button>
              </div>
            ) : (
              <div ref={searchRef} className="relative">
                <input
                  type="text"
                  placeholder="Search by name or email…"
                  value={memberQuery}
                  onChange={e => { setMemberQuery(e.target.value); setSearchOpen(true) }}
                  onFocus={() => setSearchOpen(true)}
                  className="w-full h-8 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black"
                />
                {searchOpen && memberResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-20 overflow-hidden">
                    {memberResults.map(m => (
                      <button
                        key={m.id}
                        onClick={() => { setSelectedMember(m); setMemberQuery(''); setSearchOpen(false) }}
                        className="w-full text-left px-3 py-2.5 hover:bg-neutral-50 border-b border-neutral-100 last:border-0"
                      >
                        <p className="text-[12.5px] font-medium text-neutral-900">{m.firstName} {m.lastName}</p>
                        <p className="text-[11px] text-neutral-400">{m.email}</p>
                      </button>
                    ))}
                  </div>
                )}
                {searchOpen && memberQuery.length >= 2 && memberResults.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-20 px-3 py-3">
                    <p className="text-[12px] text-neutral-400">No members found.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-3">Cart</p>
            {cart.length === 0 ? (
              <p className="text-[12.5px] text-neutral-400 py-4">No items added yet.</p>
            ) : (
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-medium text-neutral-900 truncate">{item.name}</p>
                      <p className="text-[11px] text-neutral-400">{fmt(item.amount)} each</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => updateQty(item.id, item.quantity - 1)}
                        className="w-6 h-6 rounded border border-neutral-200 text-neutral-600 hover:border-black text-[12px] flex items-center justify-center"
                      >−</button>
                      <span className="w-6 text-center text-[12.5px] font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.id, item.quantity + 1)}
                        className="w-6 h-6 rounded border border-neutral-200 text-neutral-600 hover:border-black text-[12px] flex items-center justify-center"
                      >+</button>
                    </div>
                    <p className="w-12 text-right text-[12.5px] font-semibold text-neutral-900 shrink-0">
                      {fmt(item.amount * item.quantity)}
                    </p>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-neutral-300 hover:text-red-400 text-[11px] shrink-0"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total + action buttons */}
          <div className="shrink-0 px-4 py-4 border-t border-neutral-100 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-neutral-500">Total</span>
              <span className="text-[20px] font-bold text-neutral-900">{fmt(total)}</span>
            </div>

            {/* Payment link panel */}
            {paymentUrl ? (
              <div className="space-y-2">
                <p className="text-[11.5px] text-neutral-500">Share this link with the client to pay:</p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={paymentUrl}
                    className="flex-1 h-8 px-2 text-[11px] border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-600 truncate"
                  />
                  <button
                    onClick={copyLink}
                    className="h-8 px-3 text-[11.5px] font-medium rounded-lg border border-neutral-200 hover:border-black transition-colors shrink-0"
                  >
                    {copied ? '✓' : 'Copy'}
                  </button>
                </div>
                <a
                  href={paymentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center w-full h-9 bg-black text-white text-[12.5px] font-medium rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  Open checkout ↗
                </a>
                <button
                  onClick={clearCart}
                  className="w-full h-8 text-[12px] text-neutral-400 hover:text-black transition-colors"
                >
                  Clear and start over
                </button>
              </div>

            ) : terminalStatus === 'success' ? (
              /* Terminal success */
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-4 text-center">
                <p className="text-[15px] font-semibold text-emerald-700">Payment complete!</p>
                <p className="text-[11.5px] text-emerald-600 mt-1">Member record is updating…</p>
              </div>

            ) : terminalStatus === 'error' ? (
              /* Terminal error */
              <div className="space-y-2">
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-3">
                  <p className="text-[12px] font-semibold text-red-700">Payment failed</p>
                  <p className="text-[11px] text-red-500 mt-0.5 leading-snug">{terminalError}</p>
                </div>
                <button
                  onClick={() => { setTerminalStatus('idle'); setTerminalError(null) }}
                  className="w-full h-9 bg-black text-white text-[12.5px] font-medium rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  Try again
                </button>
                <button
                  onClick={clearCart}
                  className="w-full h-8 text-[12px] text-neutral-400 hover:text-black transition-colors"
                >
                  Clear cart
                </button>
              </div>

            ) : terminalBusy ? (
              /* Terminal in progress */
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-4 text-center space-y-1">
                {terminalStatus === 'connecting' && (
                  <p className="text-[12.5px] text-neutral-600">Connecting to reader…</p>
                )}
                {terminalStatus === 'waiting_card' && (
                  <>
                    {readerName && <p className="text-[10.5px] text-neutral-400">{readerName}</p>}
                    <p className="text-[13px] font-semibold text-neutral-800">Present card on reader</p>
                    <p className="text-[11px] text-neutral-400">Tap, insert, or swipe</p>
                  </>
                )}
                {terminalStatus === 'processing' && (
                  <p className="text-[12.5px] text-neutral-600">Processing payment…</p>
                )}
              </div>

            ) : (
              /* Default action buttons */
              <div className="space-y-2">
                {/* Primary: reader */}
                <button
                  onClick={handleTerminalCharge}
                  disabled={cart.length === 0}
                  className="w-full h-10 bg-black text-white text-[13px] font-semibold rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {cart.length > 0 ? `Charge reader ${fmt(total)}` : 'Charge reader'}
                </button>
                {/* Secondary: online link */}
                <button
                  onClick={handleCharge}
                  disabled={cart.length === 0 || charging}
                  className="w-full h-9 border border-neutral-300 text-[12.5px] font-medium text-neutral-700 rounded-lg hover:border-black hover:text-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {charging ? 'Creating link…' : 'Send payment link'}
                </button>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="w-full h-8 text-[12px] text-neutral-400 hover:text-black transition-colors"
                  >
                    Clear cart
                  </button>
                )}
              </div>
            )}

            {/* Reader indicator (shown when idle and connected) */}
            {readerName && terminalStatus === 'idle' && (
              <p className="text-[10.5px] text-neutral-400 text-center pt-1">
                Reader connected: {readerName}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
