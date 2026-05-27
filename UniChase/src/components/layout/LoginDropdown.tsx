import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function LoginDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-sm font-medium text-muted hover:text-teal transition-colors px-2"
      >
        Login
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-72 bg-surface rounded-2xl shadow-xl border border-gray-100 p-5 z-50">
          <h3 className="text-base font-bold text-navy mb-1">Welcome back</h3>
          <p className="text-xs text-muted mb-4">Login to your UniChase account</p>

          <div className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="Email"
              className="w-full bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
            />
            <button className="w-full bg-navy hover:bg-navy-light text-white py-2 rounded-lg text-sm font-semibold transition-colors">
              Login
            </button>
          </div>

          <p className="text-xs text-center text-muted mt-4">
            Don't have an account?{' '}
            <Link to="/signup" onClick={() => setOpen(false)} className="text-teal hover:underline">Sign up</Link>
          </p>
        </div>
      )}
    </div>
  )
}