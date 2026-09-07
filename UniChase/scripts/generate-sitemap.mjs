import 'dotenv/config'
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs'
const target = new URL('../dist/', import.meta.url)
const raw = process.env.VITE_SITE_URL
if (!raw) {
  const stale = new URL('sitemap.xml', target)
  if (existsSync(stale)) unlinkSync(stale)
  writeFileSync(new URL('robots.txt', target), 'User-agent: *\nDisallow: /moderator\nDisallow: /dashboard\n')
  console.warn('VITE_SITE_URL is unset; sitemap omitted until the public origin is configured.')
} else {
  const origin = new URL(raw)
  if (!['https:', 'http:'].includes(origin.protocol) || origin.username || origin.password || origin.pathname !== '/') throw new Error('VITE_SITE_URL must be a public http(s) origin without credentials or a path.')
  const universities = JSON.parse(readFileSync(new URL('../data/universities.json', import.meta.url), 'utf8'))
  const programs = JSON.parse(readFileSync(new URL('../data/programs.json', import.meta.url), 'utf8'))
  const rows = Array.isArray(universities) ? universities : universities.universities
  const courseRows = Array.isArray(programs) ? programs : programs.programs
  const paths = ['/', '/universities', '/programs', '/compare', '/match', '/faq', '/visa-guide', '/community', '/news', '/contact', ...rows.map(row => `/universities/${row.slug}`), ...courseRows.map(row => `/programs/${row.slug}`)]
  const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;')
  writeFileSync(new URL('sitemap.xml', target), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path => `<url><loc>${escape(new URL(path, origin).href)}</loc></url>`).join('')}</urlset>\n`)
  writeFileSync(new URL('robots.txt', target), `User-agent: *\nDisallow: /moderator\nDisallow: /dashboard\nSitemap: ${new URL('/sitemap.xml', origin).href}\n`)
}
