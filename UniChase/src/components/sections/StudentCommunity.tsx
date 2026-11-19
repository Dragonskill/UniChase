import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowUpRight, ChevronLeft, ChevronRight, GraduationCap, Users, MessageCircle, CalendarDays, Mic, X } from 'lucide-react'
import type { University } from '@/data/universities'
import { fetchCommunityPosts, type CommunityPost } from '@/lib/api'

const majors = ['Economics', 'Business Administration', 'Computer Science', 'Korean Language', 'Mechanical Engineering']
const teamRoles = ['President', 'Vice President', 'Secretary', 'Treasurer', 'Events Lead', 'Media Lead']
const filters = ['All', 'Events', 'Posts', 'Interviews'] as const
function safeLink(url?: string | null) {
  if (!url) return undefined
  try { const parsed = new URL(url); return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : undefined } catch { return undefined }
}

function CardRail({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  const rail = useRef<HTMLDivElement>(null)
  function scroll(direction: number) {
    const element = rail.current
    element?.scrollBy({ left: direction * element.clientWidth * 0.8, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }
  return <section className="rounded-2xl border border-gray-200 bg-surface p-5 sm:p-6">
    <div className="mb-5 flex items-start justify-between gap-4"><div><h3 className="text-xl font-bold text-navy">{title}</h3><p className="mt-1 text-sm text-muted">{description}</p></div>
      <div className="flex shrink-0 gap-2">{[-1, 1].map(direction => <button key={direction} type="button" onClick={() => scroll(direction)} aria-label={`Scroll ${title} ${direction < 0 ? 'left' : 'right'}`} className="rounded-full border border-gray-200 p-2 text-navy hover:border-teal hover:text-teal">{direction < 0 ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}</button>)}</div>
    </div>
    <div ref={rail} tabIndex={0} role="region" aria-label={`${title} cards`} className="community-rail flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3">{children}</div>
  </section>
}

export default function StudentCommunity({ university }: { university: University }) {
  const isKorea = university.slug === 'korea-university' || university.name === 'Korea University'
  const universityCouncil = university.studentCouncil
  const council = isKorea && !/KUUSA|Uzbek/i.test(universityCouncil?.name || '') ? undefined : universityCouncil
  const location = useLocation()
  const title = isKorea ? 'KUUSA' : council?.name || 'Student community'
  const roles = (council?.roles || []).filter(role => role.status === 'active' && role.displayName)
  const [kind, setKind] = useState<typeof filters[number]>('All')
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [feedStatus, setFeedStatus] = useState('Loading campus updates…')
  const [subject, setSubject] = useState('')
  const [question, setQuestion] = useState('')
  const [message, setMessage] = useState('')
  const dialog = useRef<HTMLDialogElement>(null)
  const lastTrigger = useRef<HTMLButtonElement | null>(null)
  const draftKey = `unichase.advisor-draft.${university.id}`
  useEffect(() => {
    if (location.hash === '#student-community') document.getElementById('student-community')?.scrollIntoView({ block: 'start' })
  }, [location.hash])
  useEffect(() => {
    let active = true
    fetchCommunityPosts({ universityId: university.id, limit: 30 }).then(result => {
      if (active) { setPosts(result.data.filter(post => post.status === 'published')); setFeedStatus('') }
    }).catch(() => { if (active) setFeedStatus('Campus updates are not connected yet. Published stories will appear here when available.') })
    return () => { active = false }
  }, [university.id])
  function openQuestion(major: string, trigger: HTMLButtonElement) {
    setSubject(major); setMessage(''); setQuestion(''); lastTrigger.current = trigger
    try { const saved = JSON.parse(localStorage.getItem(`${draftKey}.${major}`) || 'null'); if (saved?.subject === major && typeof saved.question === 'string') setQuestion(saved.question) } catch { /* A new draft works without browser storage. */ }
    dialog.current?.showModal()
  }
  const visible = posts.filter(post => kind === 'All' || (kind === 'Events' ? /event/i.test(post.category) : kind === 'Interviews' ? /interview/i.test(post.category) : !/event|interview/i.test(post.category)))
  const social = safeLink(council?.socialUrl)
  const website = safeLink(council?.websiteUrl)
  return <div id="student-community" className="min-w-0 space-y-5 md:col-span-2 scroll-mt-24">
    <section className="community-intro relative overflow-hidden rounded-2xl border border-gray-200 bg-surface p-6 sm:p-8">
      <p className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-teal">Your people. Your campus.</p>
      <div className="flex flex-col gap-5 sm:flex-row">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-navy text-lg font-bold text-white">{isKorea ? 'KUUSA' : <Users size={32} />}</div>
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-3"><h2 className="text-3xl font-bold text-navy">{title}</h2><span className="rounded-full border border-gray-200 bg-cream px-3 py-1 text-xs text-muted">{isKorea ? 'Profile in progress' : council?.verificationStatus === 'verified' ? 'Verified profile' : 'Profile in progress'}</span></div>
          <p className="mt-1 text-sm text-muted">{isKorea ? 'Korea University Uzbek Students Association · Korea University' : university.name}</p>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-700">{isKorea ? 'A place for Uzbek students at Korea University to connect, share experiences, and find their feet on campus. Discover the team, explore support by major, and follow community stories.' : council?.description || 'Connect with your campus community, find student support, and discover stories from university life.'}</p>
          <div className="mt-5 flex flex-wrap gap-2">{(isKorea ? ['Uzbek student community', 'Campus life', 'Peer support'] : ['Student community', 'Campus life']).map(label => <span key={label} className="rounded-full bg-teal/10 px-3 py-1.5 text-xs font-medium text-teal">{label}</span>)}</div>
          <div className="mt-5 flex flex-wrap gap-3 text-sm">{social && <a href={social} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2">Social channel <ArrowUpRight size={15} /></a>}{website && <a href={website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2">Council website <ArrowUpRight size={15} /></a>}
            {!social && <span className="text-xs text-muted">Telegram · Instagram · LinkedIn — official links awaiting confirmation</span>}
          </div>
        </div>
      </div>
    </section>

    <CardRail title="Management Team" description="Meet the people behind your student community.">
      {(roles.length ? roles : teamRoles.map((roleTitle, id) => ({ id, roleTitle, displayName: null, department: null, avatarUrl: null, contactUrl: null }))).map(role => <article key={role.id} className="community-person w-48 shrink-0 snap-start overflow-hidden rounded-xl border border-gray-200 bg-surface sm:w-56">
        <div className="community-portrait relative flex aspect-square items-center justify-center"><Users className="text-teal/40" size={54} aria-hidden="true" />{safeLink(role.avatarUrl) && <img src={safeLink(role.avatarUrl)} alt={role.displayName || ''} loading="lazy" className="absolute inset-0 h-full w-full object-cover" onError={event => { event.currentTarget.style.display = 'none' }} />}<span className="absolute left-3 top-3 rounded-full bg-navy px-3 py-1 text-[11px] font-semibold text-white">{role.roleTitle}</span></div>
        <div className="p-4"><h4 className="font-bold text-navy">{role.displayName || 'To be announced'}</h4><p className="mt-1 text-sm text-teal">{role.roleTitle}</p><p className="mt-2 text-xs text-muted">{role.department || 'Member details awaiting confirmation'}</p>{safeLink(role.contactUrl) && <a href={safeLink(role.contactUrl)} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm text-teal">Contact <ArrowUpRight size={14} /></a>}</div>
      </article>)}
    </CardRail>

    <CardRail title="Major Advisors" description="Prepare your questions for a senior student in your field.">
      {majors.map(major => <article key={major} className="community-person flex w-48 shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-gray-200 bg-surface sm:w-56"><div className="community-portrait flex aspect-[4/3] items-center justify-center"><GraduationCap size={54} className="text-teal/40" aria-hidden="true" /></div><div className="flex flex-1 flex-col p-4"><h4 className="font-bold text-navy">{major}</h4><p className="mt-2 text-xs leading-5 text-muted">Advisor introductions coming soon. Save a question while you explore.</p><button type="button" onClick={event => openQuestion(major, event.currentTarget)} className="mt-5 rounded-lg bg-navy px-3 py-2.5 text-sm font-semibold text-white hover:bg-navy-light">Prepare a question</button></div></article>)}
    </CardRail>

    <section className="rounded-2xl border border-gray-200 bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="text-xl font-bold text-navy">Events, Posts &amp; Interviews</h3><p className="mt-1 text-sm text-muted">Stories, conversations, and moments from campus.</p></div><div className="flex flex-wrap gap-2" role="group" aria-label="Filter campus updates">{filters.map(filter => <button type="button" key={filter} aria-pressed={filter === kind} onClick={() => setKind(filter)} className={`rounded-full border px-4 py-2 text-sm transition-colors ${filter === kind ? 'border-navy bg-navy text-white' : 'border-gray-200 text-muted hover:border-teal'}`}>{filter}</button>)}</div></div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{visible.map(post => <Link key={post.id} to={`/community/${post.id}`} className="rounded-xl border border-gray-200 p-5 hover:border-teal"><p className="text-xs font-bold uppercase tracking-wider text-teal">{post.category}</p><h4 className="mt-3 font-bold text-navy">{post.title}</h4><p className="mt-2 line-clamp-3 text-sm text-muted">{post.content}</p><p className="mt-4 text-xs text-muted">{new Date(post.createdAt).toLocaleDateString()}</p></Link>)}</div>
      {!visible.length && <div className="mt-2 rounded-xl bg-cream px-5 py-8 text-center"><div className="mb-4 flex justify-center gap-4 text-teal"><CalendarDays size={22} /><MessageCircle size={22} /><Mic size={22} /></div><h4 className="font-semibold text-navy">{kind === 'All' ? 'A new chapter is coming' : `No ${kind.toLowerCase()} published yet`}</h4><p role="status" className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{feedStatus || 'Check back for updates from your university community.'}</p></div>}
    </section>

    <dialog ref={dialog} onClose={() => lastTrigger.current?.focus()} className="community-dialog w-[calc(100%-2rem)] max-w-md rounded-2xl border border-gray-200 bg-surface p-6 text-navy shadow-xl">
      <div className="flex items-center justify-between gap-3"><h3 className="text-xl font-bold">Your question</h3><button type="button" aria-label="Close question draft" onClick={() => dialog.current?.close()} className="rounded-full p-2 hover:bg-cream"><X size={20} /></button></div>
      <p className="mt-1 text-sm text-teal">{subject}</p><p className="mt-3 text-sm leading-6 text-muted">Save a draft on this device. It is not sent to an advisor.</p>
      <label htmlFor={`question-${university.id}`} className="mt-5 block text-sm font-medium">What would you like to know?</label><textarea id={`question-${university.id}`} maxLength={2000} value={question} onChange={event => { setQuestion(event.target.value); setMessage('') }} placeholder="Ask about courses, campus life, or settling in…" className="mt-2 min-h-32 w-full rounded-xl border border-gray-200 bg-cream p-3 text-sm" />
      <div className="mt-4 flex items-center justify-between gap-4"><span className="text-xs text-muted">{question.length}/2000</span><button type="button" disabled={!question.trim()} onClick={() => { try { localStorage.setItem(`${draftKey}.${subject}`, JSON.stringify({ subject, question: question.trim() })); setMessage('Draft saved on this device.') } catch { setMessage('Storage is unavailable. Copy your question before closing.') } }} className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Save draft</button></div><p role="status" className="mt-3 text-sm text-teal">{message}</p>
    </dialog>
  </div>
}
