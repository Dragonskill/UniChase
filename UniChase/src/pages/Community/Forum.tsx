import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { forumPosts, qaPosts } from '@/data/community'

export default function Forum() {
  const [tab, setTab] = useState<'forum' | 'qa'>('forum')

  return (
    <div className="max-w-4xl mx-auto px-5 sm:px-6 py-10">
      <h1 className="text-3xl font-bold text-navy mb-2">Community</h1>
      <p className="text-muted mb-8">Connect, share, and ask the UniChase community</p>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex gap-1 bg-surface p-1 rounded-xl shadow-sm">
          <button onClick={() => setTab('forum')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'forum' ? 'bg-navy text-white' : 'text-muted hover:text-ink'}`}>Forum</button>
          <button onClick={() => setTab('qa')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'qa' ? 'bg-navy text-white' : 'text-muted hover:text-ink'}`}>Q&A</button>
        </div>
        <button className="text-sm bg-teal text-white px-4 py-2 rounded-lg hover:bg-teal-light transition-colors font-medium">
          {tab === 'forum' ? '+ New Post' : '+ Ask Question'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {tab === 'forum' ? (
          <motion.div key="forum" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} className="bg-surface rounded-2xl shadow-sm divide-y divide-gray-100">
            {forumPosts.map((post) => (
              <Link key={post.id} to={`/community/${post.id}`} className="flex items-center gap-3 p-4 hover:bg-cream transition-colors">
                <span className="text-xs bg-cream-dark text-ink px-2 py-0.5 rounded flex-shrink-0">{post.tag}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy truncate">{post.title}{post.isNew && <span className="text-xs text-teal font-semibold ml-2">NEW</span>}</p>
                  <p className="text-xs text-muted mt-0.5">{post.author}</p>
                </div>
                <div className="flex flex-col items-end flex-shrink-0">
                  <span className="text-xs text-muted">💬 {post.replies}</span>
                  <span className="text-xs text-muted mt-0.5">{post.date}</span>
                </div>
              </Link>
            ))}
          </motion.div>
        ) : (
          <motion.div key="qa" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} className="flex flex-col gap-3">
            {qaPosts.map((post) => (
              <Link key={post.id} to={`/community/qa-${post.id}`} className="flex items-center gap-4 p-4 bg-surface rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col items-center justify-center w-14 flex-shrink-0">
                  <span className={`text-lg font-bold ${post.solved ? 'text-teal' : 'text-muted'}`}>{post.answers}</span>
                  <span className="text-xs text-muted">answers</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-navy truncate">{post.title}{post.solved && <span className="text-xs text-teal bg-teal/10 px-2 py-0.5 rounded-full ml-2">✓ Solved</span>}</p>
                  <p className="text-xs text-muted mt-1">{post.author} · {post.date}</p>
                </div>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}