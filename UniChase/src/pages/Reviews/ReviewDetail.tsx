import { useParams, Link } from 'react-router-dom'
import { reviews } from '@/data/reviews'
import { motion } from 'framer-motion'

export default function ReviewDetail() {
  const { id } = useParams()
  const review = reviews.find((r) => r.id === Number(id))

  if (!review) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Review not found</h1>
        <Link to="/reviews" className="text-blue-500 hover:underline">← Back to Reviews</Link>
      </div>
    )
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto px-6 py-10"
    >
      <Link to="/reviews" className="text-sm text-blue-500 hover:underline mb-6 inline-block">← Back to Reviews</Link>

      <span className="text-xs font-medium text-blue-500 uppercase tracking-widest">{review.category} · {review.readTime}</span>
      <h1 className="text-4xl font-bold text-gray-900 leading-tight mt-2 mb-4">{review.title}</h1>

      <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <span className="font-medium text-gray-700">{review.author}</span>
        <span>·</span>
        <span>{review.date}</span>
      </div>

      <img
        src={review.image}
        alt={review.title}
        className="w-full h-96 object-cover rounded-2xl mb-8"
      />

      <div className="text-gray-700 leading-relaxed">
        {review.content.split('\n\n').map((para, i) => (
          <p key={i} className="mb-4">{para}</p>
        ))}
      </div>
    </motion.article>
  )
}