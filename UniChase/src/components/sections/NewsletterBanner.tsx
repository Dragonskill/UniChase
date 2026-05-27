export default function NewsletterBanner() {
  return (
    <section className="mt-16 bg-gradient-to-r from-navy to-teal rounded-2xl px-6 sm:px-12 py-10 sm:py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
      <div className="max-w-md">
        <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug mb-5">
          Subscribe to "UniChase Insights" — career tips, insider guides and student stories straight to your inbox.
        </h2>
        <button className="bg-white text-navy px-6 py-2.5 rounded-xl font-semibold hover:bg-cream transition-colors">
          Sign up now →
        </button>
      </div>
      <div className="text-7xl sm:text-8xl">🎓</div>
    </section>
  )
}