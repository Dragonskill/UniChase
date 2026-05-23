import { Link } from 'react-router-dom'

const hero = {
  id: 1,
  category: 'K-CAMPUS',
  readTime: '7 minute read',
  title: 'Kotra unveils company list, opens applications for annual international student job fair',
  excerpt: 'Applications are now open for the biggest international student career event of the year. Find out which companies are participating and how to apply before the deadline.',
  image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1400&q=80',
  author: 'Editor_Kim',
  date: '21 May 2026',
}

const cards = [
  {
    id: 2,
    category: 'K-CAMPUS',
    readTime: '2 minute read',
    title: 'Ukrainian student\'s love for Korean literary classics',
    image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&q=80',
  },
  {
    id: 3,
    category: 'NATIONAL',
    readTime: '3 minute read',
    title: 'Seoul court rules SNU professor\'s dismissal for misconduct',
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&q=80',
  },
  {
    id: 4,
    category: 'K-CAMPUS',
    readTime: '4 minute read',
    title: 'Jeju to halve salary requirement, triple stay limit for foreign workers',
    image: 'https://images.unsplash.com/photo-1546874177-9e664107314e?w=600&q=80',
  },
]

export default function NewsSection() {
  return (
    <section className="mt-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold tracking-wide text-gray-900">NEWS</h2>
        <Link to="/news" className="text-sm text-gray-500 hover:text-blue-500">See all →</Link>
      </div>

      {/* Hero article */}
      <Link to={`/news/${hero.id}`} className="group block mb-6">
        <div className="relative w-full h-72 rounded-2xl overflow-hidden mb-4">
          <img
            src={hero.image}
            alt={hero.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-5 left-6 text-white max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-widest bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
              {hero.category} · {hero.readTime}
            </span>
            <h3 className="text-2xl font-bold leading-snug mt-2">{hero.title}</h3>
          </div>
        </div>
        <p className="text-sm text-gray-500 line-clamp-2 mb-2">{hero.excerpt}</p>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="font-medium text-gray-600">{hero.author}</span>
          <span>·</span>
          <span>{hero.date}</span>
        </div>
      </Link>

      {/* 3 cards row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {cards.map((card) => (
          <Link
            key={card.id}
            to={`/news/${card.id}`}
            className="group block"
          >
            <div className="w-full h-40 rounded-xl overflow-hidden mb-3">
              <img
                src={card.image}
                alt={card.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <p className="text-xs text-gray-400 mb-1">{card.category} · {card.readTime}</p>
            <h4 className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2">{card.title}</h4>
          </Link>
        ))}
      </div>
    </section>
  )
}