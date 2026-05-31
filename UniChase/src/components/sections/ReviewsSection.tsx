import { Link } from 'react-router-dom'
import GlowLetters from '@/components/ui/GlowLetters'
import { reviews } from '@/data/reviews'

export default function ReviewsSection() {
  const featured = reviews[0]
  const rest = reviews.slice(1, 5)

  return (
    <section className="mt-12 sm:mt-16">
      <div className="flex items-center justify-between mb-6">
        <GlowLetters as="h2" text="REAL LIFE REVIEWS" variant="section" className="text-lg sm:text-xl font-bold tracking-wide text-navy" />
        <Link to="/reviews" className="text-sm text-muted hover:text-teal transition-colors">See all →</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* Featured */}
        <Link to={`/reviews/${featured.id}`} className="group block bg-surface rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="h-56 sm:h-64 overflow-hidden">
            <img src={featured.image} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
          <div className="p-5">
            <span className="text-xs font-semibold text-teal uppercase tracking-wide">{featured.category}</span>
            <h3 className="text-lg font-bold text-navy leading-snug mt-1 mb-2">{featured.title}</h3>
            <p className="text-sm text-muted line-clamp-2 mb-3">{featured.excerpt}</p>
            <p className="text-xs text-muted"><span className="font-medium text-ink">{featured.author}</span> · {featured.date}</p>
          </div>
        </Link>

        {/* List */}
        <div className="flex flex-col gap-3">
          {rest.map((r) => (
            <Link key={r.id} to={`/reviews/${r.id}`} className="group flex gap-4 bg-surface rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
              <img src={r.image} alt={r.title} className="w-24 h-20 object-cover rounded-lg flex-shrink-0" />
              <div className="flex flex-col justify-center min-w-0">
                <p className="text-xs text-muted mb-1">{r.category} · {r.readTime}</p>
                <p className="text-sm font-semibold text-navy leading-snug line-clamp-2 group-hover:text-teal transition-colors">{r.title}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
