export default function NewsletterBanner() {
  return (
    <section className="mt-16 bg-green-400 rounded-2xl px-12 py-12 flex items-center justify-between">
      <div className="max-w-sm">
        <h2 className="text-2xl font-black text-black leading-snug mb-6">
          Subscribe to our newsletter "UniChase Insights" and stay ahead in Korea with career tips, insider guides and student stories!
        </h2>
        <button className="bg-black text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-900 transition-colors">
          Sign up now →
        </button>
      </div>
      <div className="text-8xl">🎓</div>
    </section>
  )
}