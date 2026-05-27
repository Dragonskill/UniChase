import { useState } from 'react'
import { Link } from 'react-router-dom'
import LoginDropdown from './LoginDropdown'

const links = [
  { to: '/university', label: 'University' },
  { to: '/reviews', label: 'Reviews' },
  { to: '/news', label: 'News' },
  { to: '/careers', label: 'Careers' },
  { to: '/community', label: 'Community' },
]

export default function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')

  return (
    <nav className="w-full bg-surface/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="text-xl font-bold text-navy">
          Uni<span className="text-teal">Chase</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex gap-8">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="text-sm font-medium text-muted hover:text-teal transition-colors">
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="hidden sm:flex items-center">
            <div className={`overflow-hidden transition-all duration-300 ${searchOpen ? 'w-44 opacity-100' : 'w-0 opacity-0'}`}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="w-full bg-cream border border-gray-200 rounded-full px-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                autoFocus={searchOpen}
              />
            </div>
            <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 text-muted hover:text-teal transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          {/* Auth - desktop */}
          <div className="hidden md:block"><LoginDropdown /></div>
          <Link to="/signup" className="hidden md:inline text-sm font-semibold px-5 py-2 bg-navy text-white rounded-full hover:bg-navy-light transition-colors">Sign up</Link>

          {/* Hamburger - mobile */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-navy">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-surface px-5 py-4 flex flex-col gap-3">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)} className="text-sm font-medium text-ink hover:text-teal">
              {l.label}
            </Link>
          ))}
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <Link to="/login" onClick={() => setMenuOpen(false)} className="flex-1 text-center text-sm font-medium py-2 border border-gray-200 rounded-full">Login</Link>
            <Link to="/signup" onClick={() => setMenuOpen(false)} className="flex-1 text-center text-sm font-semibold py-2 bg-navy text-white rounded-full">Sign up</Link>
          </div>
        </div>
      )}
    </nav>
  )
}