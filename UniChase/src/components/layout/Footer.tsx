import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="mt-20">
      {/* Top border */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="border-t border-gray-200 pt-10 pb-6 grid grid-cols-3 gap-8">
          
          {/* Logo */}
          <div>
            <Link to="/" className="text-xl font-bold text-gray-900">
              Uni<span className="text-blue-500">Chase</span>
            </Link>
            <p className="text-sm text-gray-400 mt-2">Website for Students to help them with Students</p>
          </div>

          {/* Links */}
          <div className="flex gap-16">
            <div className="flex flex-col gap-2">
              <Link to="/" className="text-sm text-gray-600 hover:text-blue-500">About</Link>
              <Link to="/" className="text-sm text-gray-600 hover:text-blue-500">Contact us</Link>
              <Link to="/" className="text-sm text-gray-600 hover:text-blue-500">Advertising</Link>
              <Link to="/" className="text-sm text-gray-600 hover:text-blue-500">How UniChase works</Link>
            </div>
            <div className="flex flex-col gap-2">
              <Link to="/" className="text-sm text-gray-600 hover:text-blue-500">Terms of use</Link>
              <Link to="/" className="text-sm text-gray-600 hover:text-blue-500">Privacy policy</Link>
              <Link to="/" className="text-sm text-gray-600 hover:text-blue-500">Copyright policy</Link>
              <Link to="/" className="text-sm text-gray-600 hover:text-blue-500">Newsletter</Link>
            </div>
          </div>

          {/* Contact & Social */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">unichase@contact.com</p>
            <div className="flex gap-3">
              <a href="#" className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 text-sm">ig</a>
              <a href="#" className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 text-sm">yt</a>
              <a href="#" className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 text-sm">tk</a>
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="border-t border-gray-100 py-4 text-center">
          <p className="text-xs text-gray-400">
            © 2026 UniChase. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}