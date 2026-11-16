import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Bell, Moon, Search, Sun } from 'lucide-react'
import LoginDropdown from './LoginDropdown'
import GlowLetters from '@/components/ui/GlowLetters'
import { universities } from '@/data/universities'
import { fetchNotifications, fetchUnreadNotificationCount, markAllNotificationsRead, type NotificationItem } from '@/lib/api'
import { useI18n, type Language } from '@/lib/i18n'
import { authChangeEvent, clearToken, getStoredUser, getToken } from '@/lib/storage'
import { getStoredTheme, setStoredTheme, watchSystemTheme, themeChangeEvent, type ThemeMode } from '@/lib/theme'
import { universitySearchScore } from '@/lib/universitySearch'

const links = [
  { to: '/university', labelKey: 'university' },
  { to: '/reviews', labelKey: 'reviews' },
  { to: '/news', labelKey: 'news' },
  { to: '/community', labelKey: 'community' },
  { to: '/match', labelKey: 'match' },
] as const

const discoveryTools = [
  { to: '/match', label: 'Best Match', detail: 'Personalized university suggestions' },
  { to: '/compare', label: 'Compare', detail: 'Side-by-side university review' },
  { to: '/roadmap', label: 'Roadmap', detail: 'Application task planning' },
  { to: '/calendar', label: 'Calendar', detail: 'Deadlines and reminders' },
  { to: '/visa-guide', label: 'Visa guide', detail: 'Visa preparation checklist' },
  { to: '/cost-calculator', label: 'Cost calculator', detail: 'Estimate study and living costs' },
] as const

function notificationPath(value?: string | null) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/notifications'
}

export default function Navbar() {
  const { language, setLanguage, t } = useI18n()
  const navigate = useNavigate()
  const navRef = useRef<HTMLElement>(null)
  useEffect(() => watchSystemTheme(), [])
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredTheme())
  const [signedIn, setSignedIn] = useState(() => Boolean(getToken() && getStoredUser()))
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const quickSearchUniversities = useMemo(() => {
    const value = query.trim()
    if (!value) return universities.slice(0, 4)
    return universities
      .map((university) => ({ university, score: universitySearchScore(university, value) }))
      .filter((result) => result.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((result) => result.university)
  }, [query])
  const quickSearchTools = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return discoveryTools.slice(0, 3)
    return discoveryTools.filter((tool) => `${tool.label} ${tool.detail}`.toLowerCase().includes(value)).slice(0, 4)
  }, [query])

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

  useEffect(() => {
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMenuOpen(false); setSearchOpen(false); setNotificationOpen(false) }
    }
    const shortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTyping = target?.matches('input, textarea, select, [contenteditable="true"]')
      if (window.matchMedia('(min-width: 1280px)').matches && !isTyping && (((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') || event.key === '/')) {
        event.preventDefault()
        setSearchOpen(true)
        setNotificationOpen(false)
      }
    }
    const outside = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) { setMenuOpen(false); setSearchOpen(false); setNotificationOpen(false) }
    }
    document.addEventListener('keydown', dismiss)
    document.addEventListener('keydown', shortcut)
    document.addEventListener('pointerdown', outside)
    return () => { document.removeEventListener('keydown', dismiss); document.removeEventListener('keydown', shortcut); document.removeEventListener('pointerdown', outside) }
  }, [])

  const search = (event: FormEvent) => {
    event.preventDefault()
    navigate(`/university${query.trim() ? `?search=${encodeURIComponent(query.trim())}` : ''}`)
    setMenuOpen(false)
    setSearchOpen(false)
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
      {theme === 'dark' ? <Sun key="sun" className="theme-toggle-icon h-4 w-4" aria-hidden="true" /> : <Moon key="moon" className="theme-toggle-icon h-4 w-4" aria-hidden="true" />}
    </button>
  )

  return (
    <nav ref={navRef} aria-label="Main navigation" className="w-full bg-surface border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="text-xl font-bold text-navy" aria-label="UniChase home">
          <GlowLetters text="Uni" variant="brand" />
          <GlowLetters text="Chase" variant="brand" className="text-teal" />
        </Link>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-4 xl:gap-6">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => `${l.to === '/match' ? 'hidden xl:inline' : ''} navbar-link ${isActive ? 'navbar-link--active' : ''} whitespace-nowrap text-sm font-medium text-muted hover:text-teal transition-colors`}>
              {t(l.labelKey)}
            </NavLink>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block lg:hidden xl:block">
            <button type="button" onClick={() => setSearchOpen(!searchOpen)} aria-expanded={searchOpen} aria-controls="navbar-search" aria-label="Quick search" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:text-teal" title="Quick search (Ctrl K)"><Search className="h-5 w-5" aria-hidden="true" /></button>
            {searchOpen && <form id="navbar-search" onSubmit={search} className="navbar-popover absolute right-0 top-12 w-96 max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-200 bg-surface p-3 shadow-lg">
              <div className="flex gap-2">
                <input type="search" autoFocus value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search universities and tools" placeholder="Search universities and tools" className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-cream px-3 py-2 text-sm" />
                <button type="submit" className="rounded-lg bg-navy px-3 text-sm font-semibold text-white">Search</button>
              </div>
              <div className="mt-3 max-h-80 space-y-3 overflow-y-auto">
                {quickSearchUniversities.length > 0 && <div>
                  <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted">Universities</p>
                  {quickSearchUniversities.map((university) => <Link key={university.id} to={`/universities/${university.slug || university.id}`} onClick={() => setSearchOpen(false)} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-cream">
                    <span className="min-w-0"><span className="block truncate text-sm font-semibold text-navy">{university.name}</span><span className="block text-xs text-muted">{university.location}</span></span>
                    <span className="shrink-0 text-xs text-muted">QS {university.qsRanking}</span>
                  </Link>)}
                </div>}
                {quickSearchTools.length > 0 && <div>
                  <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted">Student tools</p>
                  {quickSearchTools.map((tool) => <Link key={tool.to} to={tool.to} onClick={() => setSearchOpen(false)} className="block rounded-lg px-2 py-2 hover:bg-cream"><span className="block text-sm font-semibold text-navy">{tool.label}</span><span className="block text-xs text-muted">{tool.detail}</span></Link>)}
                </div>}
                {quickSearchUniversities.length === 0 && quickSearchTools.length === 0 && <p className="px-2 py-5 text-center text-sm text-muted">No quick results. Press Search to open the full university directory.</p>}
              </div>
              <p className="mt-2 border-t border-gray-100 px-2 pt-2 text-xs text-muted">Tip: press Ctrl/⌘ K or / to open quick search.</p>
            </form>}
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            aria-label="Language"
            className="hidden sm:block lg:hidden xl:block bg-cream border border-gray-200 rounded-full px-2 py-1 text-xs text-muted focus:outline-none focus:ring-2 focus:ring-teal"
          >
            <option value="en">EN</option>
            <option value="ko">KO</option>
            <option value="ru">RU</option>
            <option value="uz">UZ</option>
          </select>

          <div className="hidden sm:block lg:hidden xl:block">{themeToggle}</div>

          {signedIn && (
            <div className="relative hidden sm:block lg:hidden xl:block">
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
                <div className="navbar-popover absolute right-0 mt-3 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-surface p-3 shadow-lg">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-navy">Notifications</p>
                    <button type="button" onClick={readAllNotifications} className="text-xs text-teal hover:underline">Mark all read</button>
                  </div>
                  <div className="max-h-72 space-y-2 overflow-auto">
                    {notifications.length === 0 && <p className="px-2 py-4 text-sm text-muted">No notifications yet.</p>}
                    {notifications.map((item) => (
                      <Link
                        key={item.id}
                        to={notificationPath(item.linkUrl)}
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
          <div className="hidden lg:block"><LoginDropdown /></div>
          <Link to="/dashboard" className="hidden xl:inline text-sm font-medium text-muted hover:text-teal transition-colors">{t('dashboard')}</Link>
          {!signedIn && <Link to="/signup" className="hidden lg:inline text-sm font-semibold px-5 py-2 bg-navy text-white rounded-full hover:bg-navy-light transition-colors">{t('signup')}</Link>}

          {/* Hamburger - mobile */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden p-2 text-navy" aria-label="Menu" aria-expanded={menuOpen} aria-controls="mobile-menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div id="mobile-menu" className="mobile-menu-panel lg:hidden max-h-[calc(100dvh-80px)] overflow-y-auto border-t border-gray-200 bg-surface px-5 py-4 flex flex-col gap-3">
          <form onSubmit={search} className="flex gap-2"><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search universities" placeholder={t("search")} className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-cream px-3 py-2 text-sm" /><button className="rounded-lg bg-navy px-4 text-white">Go</button></form>{links.map((l) => (
            <NavLink key={l.to} to={l.to} onClick={() => setMenuOpen(false)} className={({ isActive }) => `mobile-navbar-link ${isActive ? 'mobile-navbar-link--active' : ''} text-sm font-medium text-ink hover:text-teal`}>
              {t(l.labelKey)}
            </NavLink>
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
          {signedIn && <button type="button" onClick={() => { clearToken(); setMenuOpen(false); navigate("/login") }} className="text-left text-sm text-muted">Logout</button>}{!signedIn && (
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
