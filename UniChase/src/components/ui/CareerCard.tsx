import { Link } from 'react-router-dom'

interface CareerCardProps {
  id: number
  logo: string
  title: string
  company: string
  type: string
  daysLeft: number
}

export default function CareerCard({ id, logo, title, company, type, daysLeft }: CareerCardProps) {
  return (
    <Link to={`/careers/${id}`} className="flex items-center gap-4 py-4 border-b border-gray-100 hover:opacity-80 transition-opacity">
      <img src={logo} alt={company} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-semibold text-gray-900 truncate">{title}</p>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex-shrink-0">D-{daysLeft}</span>
        </div>
        <p className="text-xs text-gray-500">{company} · {type}</p>
      </div>
    </Link>
  )
}