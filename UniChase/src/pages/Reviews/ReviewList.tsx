import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { reviews } from '@/data/reviews'

const categories = ['All', 'University', 'Study', 'Food & Travel']

export default function ReviewList() {
  const [active, setActive] = useState('All')
  const filtered = active === 'All' ? reviews : reviews.filter((r) => r.category === active)

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-6 py-10">
      <h1 className="text-3xl font-bold text-navy mb-2">Real Life Reviews</h1>
      <p className="text-muted mb-8">Stories and experiences from students in Korea</p>

      <div className="flex gap-2 mb-8 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              active === cat ? 'bg-navy text-white' : 'bg-surface text-muted hover:bg-cream-dark'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((review) => (
          <motion.div key={review.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
            <Link to={`/reviews/${review.id}`} className="group block bg-surface rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="h-44 overflow-hidden">
                <img src={review.image} alt={review.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-4">
                <span className="text-xs font-medium text-teal">{review.category}</span>
                <h3 className="text-base font-semibold text-navy leading-snug mt-1 mb-2 line-clamp-2">{review.title}</h3>
                <p className="text-sm text-muted line-clamp-2 mb-3">{review.excerpt}</p>
                <p className="text-xs text-muted"><span className="font-medium text-ink">{review.author}</span> · {review.date}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}