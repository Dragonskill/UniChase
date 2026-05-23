import { Link } from 'react-router-dom'

interface ArticleCardProps {
  id: number
  category: string
  readTime: string
  title: string
  image: string
  linkTo: string
}

export default function ArticleCard({ category, readTime, title, image, linkTo }: ArticleCardProps) {
  return (
    <Link to={linkTo} className="flex gap-3 items-start hover:opacity-80 transition-opacity">
      <img
        src={image}
        alt={title}
        className="w-20 h-16 object-cover rounded-lg flex-shrink-0"
      />
      <div>
        <p className="text-xs text-gray-500 mb-1">{category} · {readTime}</p>
        <p className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2">{title}</p>
      </div>
    </Link>
  )
}