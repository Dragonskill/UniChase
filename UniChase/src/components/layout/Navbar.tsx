import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Moon, Sun } from 'lucide-react'
import LoginDropdown from './LoginDropdown'
import GlowLetters from '@/components/ui/GlowLetters'
import { fetchNotifications, fetchUnreadNotificationCount, markAllNotificationsRead, type NotificationItem } from '@/lib/api'
import { useI18n, type Language } from '@/lib/i18n'
import { authChangeEvent, getStoredUser, getToken } from '@/lib/storage'
import { getStoredTheme, setStoredTheme, themeChangeEvent, type ThemeMode } from '@/lib/theme'

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
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredTheme())
  const [signedIn, setSignedIn] = useState(() => Boolean(getToken() && getStoredUser()))
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  useEffect(() => {
    function syncAuth() {
      const hasSession = Boolean(getToken() && getStoredUser())
      setSignedIn(hasSession)
      if (!hasSession) {
        setUnreadCount(0)
        setNotifications([])
      }
    }

    window.addEventListener(authChangeEvent, syncAuth)
    window.addEventListener('storage', syncAuth)
    return () => {
      window.removeEventListener(authChangeEvent, syncAuth)
      window.removeEventListener('storage', syncAuth)
    }
  }, [])

  useEffect(() => {
    function syncTheme() {
      setTheme(getStoredTheme())
    }

    window.addEventListener(themeChangeEvent, syncTheme)
    window.addEventListener('storage', syncTheme)
    return () => {
      window.removeEventListener(themeChangeEvent, syncTheme)
      window.removeEventListener('storage', syncTheme)
    }
  }, [])

  useEffect(() => {
    const token = getToken()
    if (!token || !signedIn) {
      return
    }

    fetchUnreadNotificationCount(token).then(setUnreadCount).catch(() => undefined)
    fetchNotifications(token).then((items) => setNotifications(items.slice(0, 5))).catch(() => undefined)
  }, [signedIn])

  const readAllNotifications = () => {
    const token = getToken()
    if (!token) return

    markAllNotificationsRead(token).then(() => {
      setUnreadCount(0)
      setNotifications((items) => items.map((item) => ({ ...item, isRead: true })))
    }).catch(() => undefined)
  }

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    setStoredTheme(nextTheme)
  }

  const themeToggle = (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-cream text-muted hover:text-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
    </button>
  )

  return (
    <nav className="w-full bg-surface/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="text-xl font-bold text-navy" aria-label="UniChase home">
          <GlowLetters text="Uni" variant="brand" />
          <GlowLetters text="Chase" variant="brand" className="text-teal" />
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

          <div className="hidden sm:block">{themeToggle}</div>

          {signedIn && (
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setNotificationOpen((current) => !current)}
                aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-cream text-muted hover:text-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
              >
                <Bell className="h-4 w-4" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-teal px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {notificationOpen && (
                <div className="absolute right-0 mt-3 w-80 rounded-xl border border-gray-200 bg-surface p-3 shadow-lg">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-navy">Notifications</p>
                    <button type="button" onClick={readAllNotifications} className="text-xs text-teal hover:underline">Mark all read</button>
                  </div>
                  <div className="max-h-72 space-y-2 overflow-auto">
                    {notifications.length === 0 && <p className="px-2 py-4 text-sm text-muted">No notifications yet.</p>}
                    {notifications.map((item) => (
                      <Link
                        key={item.id}
                        to={item.linkUrl || '/notifications'}
                        onClick={() => setNotificationOpen(false)}
                        className="block rounded-lg bg-cream px-3 py-2 text-sm hover:bg-cream-dark"
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-navy">{item.title}</span>
                          {!item.isRead && <span className="h-2 w-2 rounded-full bg-teal" aria-label="Unread" />}
                        </span>
                        <span className="mt-1 line-clamp-2 text-xs text-muted">{item.message}</span>
                      </Link>
                    ))}
                  </div>
                  <Link to="/notifications" onClick={() => setNotificationOpen(false)} className="mt-3 block text-center text-xs font-semibold text-teal hover:underline">
                    View all
                  </Link>
                </div>
              )}
            </div>
          )}

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
          {signedIn && (
            <Link to="/notifications" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-ink hover:text-teal">
              Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''}
            </Link>
          )}
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
          <div className="sm:hidden">{themeToggle}</div>
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
