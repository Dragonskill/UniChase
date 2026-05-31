import { Link } from 'react-router-dom'
import GlowLetters from '@/components/ui/GlowLetters'
import { useManagedForumPosts } from '@/lib/contentHooks'

export default function CommunitySection() {
  const forumPosts = useManagedForumPosts()

  return (
    <section className="mt-12 sm:mt-16">
      <div className="flex items-center justify-between mb-4">
        <GlowLetters as="h2" text="COMMUNITY" variant="section" className="text-lg sm:text-xl font-bold tracking-wide text-navy" />
        <Link to="/community" className="text-sm text-muted hover:text-teal transition-colors">See all</Link>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm divide-y divide-gray-100">
        {forumPosts.slice(0, 5).map((post) => (
          <Link key={post.id} to={`/community/${post.id}`} className="flex items-center gap-3 p-4 hover:bg-cream transition-colors">
            <span className="text-xs bg-cream-dark text-ink px-2 py-0.5 rounded flex-shrink-0">{post.tag}</span>
            <p className="text-sm text-ink flex-1 truncate">{post.title}</p>
            {post.isNew && <span className="text-xs text-teal font-semibold flex-shrink-0">NEW</span>}
            <span className="text-xs text-muted flex-shrink-0">{post.date}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
