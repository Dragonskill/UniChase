import { Link } from 'react-router-dom'
import GlowLetters from '@/components/ui/GlowLetters'
import { useManagedNews } from '@/lib/contentHooks'

export default function NewsSection() {
  const news = useManagedNews()
  const hero = news[0]
  const cards = news.slice(1, 4)

  if (!hero) {
    return null
  }

  return (
    <section className="mt-12 sm:mt-16">
      <div className="flex items-center justify-between mb-6">
        <GlowLetters as="h2" text="NEWS" variant="section" className="text-lg sm:text-xl font-bold tracking-wide text-navy" />
        <Link to="/news" className="text-sm text-muted hover:text-teal transition-colors">See all</Link>
      </div>

      <Link to={`/news/${hero.id}`} className="group block mb-6">
        <div className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden">
          <img src={hero.image} alt={hero.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/30 to-transparent" />
          <div className="absolute bottom-5 left-5 sm:left-6 text-white max-w-2xl pr-5">
            <span className="text-xs font-semibold uppercase tracking-widest bg-teal px-3 py-1 rounded-full">{hero.category} - {hero.readTime}</span>
            <GlowLetters as="h3" text={hero.title} variant="hero" className="text-xl sm:text-2xl font-bold leading-snug mt-2" />
          </div>
        </div>
      </Link>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {cards.map((card) => (
          <Link key={card.id} to={`/news/${card.id}`} className="group block bg-surface rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="h-40 overflow-hidden">
              <img src={card.image} alt={card.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-4">
              <p className="text-xs text-muted mb-1">{card.category} - {card.readTime}</p>
              <h4 className="text-sm font-semibold text-navy leading-snug line-clamp-2 group-hover:text-teal transition-colors">{card.title}</h4>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
