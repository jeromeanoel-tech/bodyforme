export default function SetupPaymentSuccessPage() {
  return (
    <main className="min-h-screen bg-[#f4ede1] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md bg-[#fdfaf6] border border-[#d8ccba] p-10 text-center">
        <div className="w-12 h-12 rounded-full bg-[#2a1506] text-[#f4ede1] text-2xl flex items-center justify-center mx-auto mb-6">
          ✓
        </div>
        <p className="text-[11px] tracking-[.18em] uppercase text-[#7a4a2a] mb-4">All done</p>
        <h1 className="font-serif text-3xl font-medium text-[#2a1506] mb-3 leading-tight">
          Bank details<br /><em>saved</em>
        </h1>
        <p className="text-[14px] text-[#6b5240] leading-relaxed mb-8">
          Your direct debit is now set up. We&apos;ll debit your account automatically on your billing date — nothing else you need to do.
        </p>
        <a
          href="/app"
          className="inline-block h-11 px-8 bg-[#2a1506] text-[#f4ede1] text-[11px] tracking-[.14em] uppercase font-medium leading-[44px]"
        >
          Go to my account
        </a>
        <p className="mt-6 text-[11px] text-[#a08568]">
          Questions? Email us at <a href="mailto:info@bodyforme.com.au" className="underline">info@bodyforme.com.au</a> or call (03) 9850 2221
        </p>
      </div>
    </main>
  )
}
