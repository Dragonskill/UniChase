import { Link } from 'react-router-dom'

interface CommunityRowProps {
  id: number
  tag: string
  title: string
  isNew?: boolean
  comments?: number
  date: string
}

export default function CommunityRow({ id, tag, title, isNew, comments, date }: CommunityRowProps) {
  return (
    <Link to={`/community/${id}`} className="flex items-center gap-3 py-3 border-b border-gray-100 hover:opacity-80 transition-opacity">
      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded flex-shrink-0">{tag}</span>
      <p className="text-sm text-gray-800 flex-1 truncate">{title}</p>
      <div className="flex items-center gap-2 flex-shrink-0">
        {isNew && <span className="text-xs text-green-500 font-semibold">NEW</span>}
        {comments && <span className="text-xs text-gray-400">[{comments}]</span>}
        <span className="text-xs text-gray-400">{date}</span>
      </div>
    </Link>
  )
}