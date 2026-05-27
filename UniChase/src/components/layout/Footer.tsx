import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="mt-20 bg-navy text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <Link to="/" className="text-xl font-bold text-white">Uni<span className="text-teal">Chase</span></Link>
            <p className="text-sm text-gray-400 mt-3 max-w-xs">Helping international students navigate study, careers and life in Korea.</p>
          </div>
          <div className="flex gap-12">
            <div className="flex flex-col gap-2">
              <Link to="/" className="text-sm text-gray-300 hover:text-teal">About</Link>
              <Link to="/" className="text-sm text-gray-300 hover:text-teal">Contact</Link>
              <Link to="/" className="text-sm text-gray-300 hover:text-teal">Advertising</Link>
            </div>
            <div className="flex flex-col gap-2">
              <Link to="/" className="text-sm text-gray-300 hover:text-teal">Terms</Link>
              <Link to="/" className="text-sm text-gray-300 hover:text-teal">Privacy</Link>
              <Link to="/" className="text-sm text-gray-300 hover:text-teal">Newsletter</Link>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold mb-3">unichase@contact.com</p>
            <div className="flex gap-3">
              {['ig', 'yt', 'tk'].map((s) => (
                <a key={s} href="#" className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center text-sm hover:bg-teal transition-colors">{s}</a>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 text-center">
          <p className="text-xs text-gray-400">© 2026 UniChase. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}