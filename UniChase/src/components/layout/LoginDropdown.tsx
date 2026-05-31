import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import PasswordInput from '@/components/auth/PasswordInput'
import { getAuthErrorMessage, loginStudentAccount } from '@/lib/authSession'
import {
  authChangeEvent,
  clearToken,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
} from '@/lib/storage'
import type { StudentUser } from '@/lib/api'

export default function LoginDropdown() {
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<StudentUser | null>(() => getStoredUser<StudentUser>())
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function syncUser() {
      setUser(getToken() ? getStoredUser<StudentUser>() : null)
    }

    window.addEventListener(authChangeEvent, syncUser)
    window.addEventListener('storage', syncUser)
    return () => {
      window.removeEventListener(authChangeEvent, syncUser)
      window.removeEventListener('storage', syncUser)
    }
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await loginStudentAccount({ email, password })
      setToken(response.token)
      setStoredUser(response.user)
      setUser(response.user)
      setEmail('')
      setPassword('')
      setOpen(false)
      navigate('/dashboard', { replace: true })
    } catch (loginError) {
      setError(getAuthErrorMessage(loginError))
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    clearToken()
    setUser(null)
    setOpen(false)
    navigate('/login')
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-sm font-medium text-muted hover:text-teal transition-colors px-2"
        aria-expanded={open}
      >
        {user ? user.name.split(' ')[0] : 'Login'}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="absolute right-0 mt-3 w-72 bg-surface rounded-2xl shadow-xl border border-gray-100 p-5 z-50 origin-top-right"
          >
            {user ? (
              <>
                <h3 className="text-base font-bold text-navy mb-1">Welcome back</h3>
                <p className="text-xs text-muted mb-4">{user.email}</p>
                <div className="flex flex-col gap-3">
                  <Link
                    to="/dashboard"
                    onClick={() => setOpen(false)}
                    className="w-full bg-navy hover:bg-navy-light text-white py-2 rounded-lg text-sm font-semibold text-center transition-colors"
                  >
                    Open dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="w-full border border-gray-200 text-muted hover:text-teal py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-base font-bold text-navy mb-1">Welcome back</h3>
                <p className="text-xs text-muted mb-4">Login to your UniChase account</p>

                <form onSubmit={submitLogin} className="flex flex-col gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    placeholder="Email"
                    required
                    className="w-full bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                  />
                  <PasswordInput
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    placeholder="Password"
                    required
                    minLength={8}
                    className="w-full bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                  />
                  {error && <p className="text-xs text-red-500" role="alert">{error}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-navy hover:bg-navy-light text-white py-2 rounded-lg text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    {loading ? 'Logging in...' : 'Login'}
                  </button>
                </form>

                <p className="text-xs text-center text-muted mt-4">
                  Don't have an account?{' '}
                  <Link to="/signup" onClick={() => setOpen(false)} className="text-teal hover:underline">Sign up</Link>
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
