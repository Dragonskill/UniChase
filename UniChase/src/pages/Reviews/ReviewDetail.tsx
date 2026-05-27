import { useParams, Link } from 'react-router-dom'
import { reviews } from '@/data/reviews'
import { motion } from 'framer-motion'

export default function ReviewDetail() {
  const { id } = useParams()
  const review = reviews.find((r) => r.id === Number(id))

  if (!review) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-navy mb-4">Review not found</h1>
        <Link to="/reviews" className="text-teal hover:underline">← Back to Reviews</Link>
      </div>
    )
  }

  return (
    <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-3xl mx-auto px-5 sm:px-6 py-10">
      <Link to="/reviews" className="text-sm text-teal hover:underline mb-8 inline-block">← Back to Reviews</Link>
      <p className="text-xs font-semibold uppercase tracking-widest text-teal mb-3">{review.category} · {review.readTime}</p>
      <h1 className="text-3xl sm:text-4xl font-bold text-navy leading-tight mb-6">{review.title}</h1>

      <div className="flex items-center gap-3 pb-6 mb-8 border-b border-gray-100">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-navy to-teal flex items-center justify-center text-white font-bold">{review.author.charAt(0)}</div>
        <div>
          <p className="text-sm font-semibold text-navy">{review.author}</p>
          <p className="text-xs text-muted">{review.date}</p>
        </div>
      </div>

      <img src={review.image} alt={review.title} className="w-full h-72 sm:h-[420px] object-cover rounded-2xl mb-10" />

      <div className="text-ink leading-relaxed text-base sm:text-lg">
        {review.content.split('\n\n').map((para, i) => <p key={i} className="mb-6">{para}</p>)}
      </div>

      <div className="mt-12 pt-8 border-t border-gray-100">
        <Link to="/reviews" className="text-sm text-teal hover:underline">← Back to all reviews</Link>
      </div>
    </motion.article>
  )
}