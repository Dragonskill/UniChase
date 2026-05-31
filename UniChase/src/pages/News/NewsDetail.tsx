import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import GlowLetters from '@/components/ui/GlowLetters'
import { useManagedNews } from '@/lib/contentHooks'

export default function NewsDetail() {
  const { id } = useParams()
  const news = useManagedNews()
  const article = news.find((a) => a.id === Number(id))

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-navy mb-4">Article not found</h1>
        <Link to="/news" className="text-teal hover:underline">Back to News</Link>
      </div>
    )
  }

  return (
    <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-3xl mx-auto px-5 sm:px-6 py-10">
      <Link to="/news" className="text-sm text-teal hover:underline mb-8 inline-block">Back to News</Link>
      <p className="text-xs font-semibold uppercase tracking-widest text-teal mb-3">{article.category} - {article.readTime}</p>
      <GlowLetters as="h1" text={article.title} variant="title" className="text-3xl sm:text-4xl font-bold text-navy leading-tight mb-6" />

      <div className="flex items-center gap-3 pb-6 mb-8 border-b border-gray-100">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-navy to-teal flex items-center justify-center text-white font-bold">{article.author.charAt(0)}</div>
        <div>
          <p className="text-sm font-semibold text-navy">{article.author}</p>
          <p className="text-xs text-muted">{article.date}</p>
        </div>
      </div>

      <img src={article.image} alt={article.title} className="w-full h-72 sm:h-96 object-cover rounded-2xl mb-8" />

      <div className="text-ink leading-relaxed text-base sm:text-lg">
        {article.content.split('\n\n').map((para, i) => <p key={i} className="mb-5">{para}</p>)}
      </div>

      <div className="mt-12 pt-8 border-t border-gray-100">
        <Link to="/news" className="text-sm text-teal hover:underline">Back to all news</Link>
      </div>
    </motion.article>
  )
}
