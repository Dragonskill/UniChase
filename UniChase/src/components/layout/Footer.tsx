import { Link } from 'react-router-dom'
import GlowLetters from '@/components/ui/GlowLetters'
import { useI18n } from '@/lib/i18n'

export default function Footer() {
  const { t } = useI18n()

  return (
    <footer className="mt-20 bg-navy text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <Link to="/" className="text-xl font-bold text-white" aria-label="UniChase home">
              <GlowLetters text="Uni" variant="brand" className="text-white" />
              <GlowLetters text="Chase" variant="brand" className="text-teal" />
            </Link>
            <p className="text-sm text-gray-400 mt-3 max-w-xs">Find your university, meet your community, and build your next chapter in Korea.</p>
          </div>
          <div className="flex gap-12">
            <div className="flex flex-col gap-2">
              <Link to="/university" className="text-sm text-gray-300 hover:text-teal">Universities</Link>
              <Link to="/contact" className="text-sm text-gray-300 hover:text-teal">{t('contact')}</Link>
              <Link to="/community" className="text-sm text-gray-300 hover:text-teal">Community</Link>
            </div>
            <div className="flex flex-col gap-2">
              <Link to="/match" className="text-sm text-gray-300 hover:text-teal">Best Match</Link>
              <Link to="/faq" className="text-sm text-gray-300 hover:text-teal">Student FAQ</Link>
              <Link to="/cost-calculator" className="text-sm text-gray-300 hover:text-teal">Cost calculator</Link>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold mb-3">Make yourself at home.</p>
            <Link to="/universities/korea-university#student-community" className="inline-flex rounded-full border border-white/20 px-4 py-2 text-sm hover:border-teal hover:text-teal">Explore KUUSA →</Link>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 text-center">
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} UniChase. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
