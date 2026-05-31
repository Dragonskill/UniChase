import { Link } from 'react-router-dom'
import GlowLetters from '@/components/ui/GlowLetters'
import { useManagedNews } from '@/lib/contentHooks'

export default function NewsList() {
  const news = useManagedNews()
  const [featured, ...items] = news

  if (!featured) {
    return (
      <div className="max-w-5xl mx-auto px-5 sm:px-6 py-10">
        <GlowLetters as="h1" text="News" variant="title" className="text-3xl font-bold text-navy mb-8" />
        <p className="text-sm text-muted">No news articles yet.</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-6 py-10">
      <GlowLetters as="h1" text="News" variant="title" className="text-3xl font-bold text-navy mb-8" />

      <Link to={`/news/${featured.id}`} className="group block mb-10">
        <div className="relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden mb-4">
          <img src={featured.image} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/30 to-transparent" />
          <div className="absolute bottom-6 left-5 sm:left-6 text-white max-w-2xl pr-5">
            <span className="text-xs font-semibold uppercase tracking-widest bg-teal px-3 py-1 rounded-full">{featured.category} - {featured.readTime}</span>
            <h2 className="text-xl sm:text-2xl font-bold leading-snug mt-2">{featured.title}</h2>
          </div>
        </div>
        <p className="text-sm text-muted">{featured.excerpt}</p>
      </Link>

      <div className="flex flex-col divide-y divide-gray-100">
        {items.map((item) => (
          <Link key={item.id} to={`/news/${item.id}`} className="group flex gap-4 sm:gap-5 py-5 hover:opacity-90 transition-opacity">
            <div className="w-28 sm:w-32 h-20 sm:h-24 rounded-xl overflow-hidden flex-shrink-0">
              <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <p className="text-xs text-muted mb-1">{item.category} - {item.readTime}</p>
              <h3 className="text-base font-semibold text-navy leading-snug mb-1 group-hover:text-teal transition-colors">{item.title}</h3>
              <p className="text-sm text-muted line-clamp-1">{item.excerpt}</p>
              <p className="text-xs text-muted mt-1">{item.date}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
