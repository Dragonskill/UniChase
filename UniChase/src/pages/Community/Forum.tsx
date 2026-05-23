import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { forumPosts, qaPosts } from '@/data/community'

export default function Forum() {
  const [tab, setTab] = useState<'forum' | 'qa'>('forum')

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Community</h1>
      <p className="text-gray-500 mb-8">Connect, share, and ask the UniChase community</p>

      {/* Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setTab('forum')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'forum' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Forum
          </button>
          <button
            onClick={() => setTab('qa')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'qa' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Q&A
          </button>
        </div>

        <button className="text-sm bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
          {tab === 'forum' ? '+ New Post' : '+ Ask Question'}
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {tab === 'forum' ? (
          <motion.div
            key="forum"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col divide-y divide-gray-100 border-t border-gray-100"
          >
            {forumPosts.map((post) => (
              <Link
                key={post.id}
                to={`/community/${post.id}`}
                className="flex items-center gap-3 py-4 hover:bg-gray-50 px-2 -mx-2 rounded-lg transition-colors"
              >
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded flex-shrink-0">{post.tag}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {post.title}
                    {post.isNew && <span className="text-xs text-green-500 font-semibold ml-2">NEW</span>}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{post.author}</p>
                </div>
                <div className="flex flex-col items-end flex-shrink-0">
                  <span className="text-xs text-gray-500">💬 {post.replies}</span>
                  <span className="text-xs text-gray-400 mt-0.5">{post.date}</span>
                </div>
              </Link>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="qa"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-3"
          >
            {qaPosts.map((post) => (
              <Link
                key={post.id}
                to={`/community/qa-${post.id}`}
                className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-sm transition-all"
              >
                <div className="flex flex-col items-center justify-center w-14 flex-shrink-0">
                  <span className={`text-lg font-bold ${post.solved ? 'text-green-500' : 'text-gray-400'}`}>{post.answers}</span>
                  <span className="text-xs text-gray-400">answers</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {post.title}
                    {post.solved && <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full ml-2">✓ Solved</span>}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{post.author} · {post.date}</p>
                </div>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}