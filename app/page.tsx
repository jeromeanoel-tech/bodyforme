export default function HomePage() {
  return (
    <main className="min-h-screen bg-cream">
      <section className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <h1 className="text-4xl font-bold text-espresso mb-4">BodyForme Pilates</h1>
        <p className="text-mushroom text-lg mb-8">Doncaster&apos;s premier hot Pilates studio</p>
        <a
          href="/free-trial"
          className="bg-terracotta text-white px-8 py-3 rounded-full text-lg font-medium hover:bg-opacity-90 transition"
        >
          Book Your Free Trial
        </a>
      </section>
    </main>
  )
}
