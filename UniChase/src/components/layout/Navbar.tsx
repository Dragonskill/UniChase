import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import LoginDropdown from './LoginDropdown'
import { useI18n, type Language } from '@/lib/i18n'
import { authChangeEvent, getStoredUser, getToken } from '@/lib/storage'

const links = [
  { to: '/university', labelKey: 'university' },
  { to: '/reviews', labelKey: 'reviews' },
  { to: '/news', labelKey: 'news' },
  { to: '/careers', labelKey: 'careers' },
  { to: '/community', labelKey: 'community' },
  { to: '/match', labelKey: 'match' },
] as const

export default function Navbar() {
  const { language, setLanguage, t } = useI18n()
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [signedIn, setSignedIn] = useState(() => Boolean(getToken() && getStoredUser()))

  useEffect(() => {
    function syncAuth() {
      setSignedIn(Boolean(getToken() && getStoredUser()))
    }

    window.addEventListener(authChangeEvent, syncAuth)
    window.addEventListener('storage', syncAuth)
    return () => {
      window.removeEventListener(authChangeEvent, syncAuth)
      window.removeEventListener('storage', syncAuth)
    }
  }, [])



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
              {t(l.labelKey)}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="hidden sm:flex items-center gap-1">
            <div className={`overflow-hidden transition-all duration-300 ${searchOpen ? 'w-48' : 'w-0'}`}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="w-full bg-cream border border-gray-200 rounded-full px-4 py-1.5 text-sm outline-none focus:border-teal transition-colors"
                autoFocus={searchOpen}
              />
            </div>
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-muted hover:text-teal transition-colors"
              aria-label="Toggle search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            aria-label="Language"
            className="hidden sm:block bg-cream border border-gray-200 rounded-full px-2 py-1 text-xs text-muted focus:outline-none focus:ring-2 focus:ring-teal"
          >
            <option value="en">EN</option>
            <option value="ko">KO</option>
            <option value="ru">RU</option>
            <option value="uz">UZ</option>
          </select>

          {/* Auth - desktop */}
          <div className="hidden md:block"><LoginDropdown /></div>
          <Link to="/dashboard" className="hidden lg:inline text-sm font-medium text-muted hover:text-teal transition-colors">{t('dashboard')}</Link>
          {!signedIn && <Link to="/signup" className="hidden md:inline text-sm font-semibold px-5 py-2 bg-navy text-white rounded-full hover:bg-navy-light transition-colors">{t('signup')}</Link>}

          {/* Hamburger - mobile */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-navy" aria-label="Menu">
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
              {t(l.labelKey)}
            </Link>
          ))}
          <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-ink hover:text-teal">
            {t('dashboard')}
          </Link>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            aria-label="Language"
            className="bg-cream border border-gray-200 rounded-full px-3 py-2 text-sm text-muted focus:outline-none focus:ring-2 focus:ring-teal"
          >
            <option value="en">EN</option>
            <option value="ko">KO</option>
            <option value="ru">RU</option>
            <option value="uz">UZ</option>
          </select>
          {!signedIn && (
            <div className="flex gap-3 pt-3 border-t border-gray-100">
              <Link to="/login" onClick={() => setMenuOpen(false)} className="flex-1 text-center text-sm font-medium py-2 border border-gray-200 rounded-full">{t('login')}</Link>
              <Link to="/signup" onClick={() => setMenuOpen(false)} className="flex-1 text-center text-sm font-semibold py-2 bg-navy text-white rounded-full">{t('signup')}</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
