import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useManagedForumPosts, useManagedQaPosts } from '@/lib/contentHooks'

export default function PostDetail() {
  const { id } = useParams()
  const forumPosts = useManagedForumPosts()
  const qaPosts = useManagedQaPosts()
  const isQA = id?.startsWith('qa-')
  const realId = isQA ? Number(id?.replace('qa-', '')) : Number(id)
  const forumPost = !isQA ? forumPosts.find((p) => p.id === realId) : null
  const qaPost = isQA ? qaPosts.find((p) => p.id === realId) : null
  const post = forumPost || qaPost

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-navy mb-4">Post not found</h1>
        <Link to="/community" className="text-teal hover:underline">Back to Community</Link>
      </div>
    )
  }

  return (
    <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-3xl mx-auto px-5 sm:px-6 py-10">
      <Link to="/community" className="text-sm text-teal hover:underline mb-8 inline-block">Back to Community</Link>

      <div className="flex items-center gap-2 mb-4">
        {forumPost && <span className="text-xs bg-cream-dark text-ink px-3 py-1 rounded-full">{forumPost.tag}</span>}
        {qaPost && <span className="text-xs bg-teal/10 text-teal px-3 py-1 rounded-full">Question</span>}
        {qaPost?.solved && <span className="text-xs bg-teal/10 text-teal px-3 py-1 rounded-full">Solved</span>}
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-navy leading-tight mb-6">{post.title}</h1>

      <div className="flex items-center gap-3 pb-6 mb-8 border-b border-gray-100">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-navy to-teal flex items-center justify-center text-white font-bold">{post.author.charAt(0)}</div>
        <div>
          <p className="text-sm font-semibold text-navy">{post.author}</p>
          <p className="text-xs text-muted">{post.date}</p>
        </div>
      </div>

      <div className="text-ink leading-relaxed text-base mb-12">
        {post.content.split('\n\n').map((para, i) => <p key={i} className="mb-4">{para}</p>)}
      </div>

      <div className="border-t border-gray-100 pt-8">
        <h2 className="text-lg font-bold text-navy mb-6">{forumPost ? `${forumPost.replies} Replies` : `${qaPost?.answers} Answers`}</h2>
        <div className="bg-surface border border-gray-100 rounded-xl p-4 mb-6 shadow-sm">
          <textarea placeholder={forumPost ? 'Write a reply...' : 'Write an answer...'} className="w-full bg-transparent text-sm resize-none focus:outline-none" rows={3} />
          <div className="flex justify-end">
            <button className="bg-teal hover:bg-teal-light text-white text-sm px-5 py-2 rounded-lg transition-colors font-medium">{forumPost ? 'Reply' : 'Answer'}</button>
          </div>
        </div>
        <p className="text-sm text-muted text-center py-8">Be the first to {forumPost ? 'reply' : 'answer'}.</p>
      </div>
    </motion.article>
  )
}
