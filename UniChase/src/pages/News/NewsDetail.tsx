import { useParams, Link } from 'react-router-dom'
import { news } from '@/data/news'
import { motion } from 'framer-motion'

export default function NewsDetail() {
  const { id } = useParams()
  const article = news.find((a) => a.id === Number(id))

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Article not found</h1>
        <Link to="/news" className="text-blue-500 hover:underline">← Back to News</Link>
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
      <Link to="/news" className="text-sm text-blue-500 hover:underline mb-6 inline-block">← Back to News</Link>

      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
        {article.category} · {article.readTime}
      </p>
      <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-4">{article.title}</h1>

      <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <span className="font-medium text-gray-700">{article.author}</span>
        <span>·</span>
        <span>{article.date}</span>
      </div>

      <img
        src={article.image}
        alt={article.title}
        className="w-full h-96 object-cover rounded-2xl mb-8"
      />

      <div className="prose max-w-none text-gray-700 leading-relaxed">
        {article.content.split('\n\n').map((para, i) => (
          <p key={i} className="mb-4">{para}</p>
        ))}
      </div>
    </motion.article>
  )
}