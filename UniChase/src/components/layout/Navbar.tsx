import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="w-full bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
      
      <Link to="/" className="text-xl font-bold text-navy-800">
        Uni<span className="text-blue-500">Chase</span>
      </Link>

      <div className="flex gap-8">
        <Link to="/university" className="text-gray-600 hover:text-blue-500">University</Link>
        <Link to="/reviews" className="text-gray-600 hover:text-blue-500">Reviews</Link>
        <Link to="/news" className="text-gray-600 hover:text-blue-500">News</Link>
        <Link to="/careers" className="text-gray-600 hover:text-blue-500">Careers</Link>
        <Link to="/community" className="text-gray-600 hover:text-blue-500">Community</Link>
      </div>

      <div className="flex gap-3">
        <Link to="/login" className="px-4 py-2 text-gray-600 hover:text-blue-500">Login</Link>
        <Link to="/signup" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Sign up</Link>
      </div>

    </nav>
  )
}