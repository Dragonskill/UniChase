import { useState, type FormEvent, type ReactNode } from 'react'
import { Loader2, LogOut, RotateCcw, Save, Trash2 } from 'lucide-react'
import PasswordInput from '@/components/auth/PasswordInput'
import type { ForumPost, QAPost } from '@/data/community'
import type { NewsArticle } from '@/data/news'
import {
  createNextId,
  getManagedForumPosts,
  getManagedMembers,
  getManagedNews,
  getManagedQaPosts,
  resetManagedForumPosts,
  resetManagedMembers,
  resetManagedNews,
  resetManagedQaPosts,
  setManagedForumPosts,
  setManagedMembers,
  setManagedNews,
  setManagedQaPosts,
  type SocietyMember,
} from '@/lib/contentStore'
import {
  claimModeratorAccount,
  getModeratorSession,
  hasModeratorAccount,
  loginModerator,
  logoutModerator,
} from '@/lib/moderatorAuth'

type ModeratorTab = 'news' | 'forum' | 'qa' | 'members'

const tabs: { id: ModeratorTab; label: string }[] = [
  { id: 'news', label: 'News' },
  { id: 'forum', label: 'Community' },
  { id: 'qa', label: 'Q&A' },
  { id: 'members', label: 'Society Members' },
]

const inputClass = 'w-full bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal'
const labelClass = 'text-xs font-semibold text-muted uppercase tracking-wide'

const today = new Date().toLocaleDateString('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const blankNews: NewsArticle = {
  id: 0,
  category: 'K-CAMPUS',
  readTime: '3 minute read',
  title: '',
  excerpt: '',
  content: '',
  image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1400&q=80',
  author: 'Moderator',
  date: today,
}

const blankForumPost: ForumPost = {
  id: 0,
  tag: 'Discussion',
  title: '',
  author: 'Moderator',
  replies: 0,
  date: today,
  isNew: true,
  content: '',
}

const blankQaPost: QAPost = {
  id: 0,
  title: '',
  author: 'Moderator',
  answers: 0,
  solved: false,
  date: today,
  content: '',
}

const blankMember: SocietyMember = {
  id: 0,
  name: '',
  role: 'Society member',
  country: '',
  university: '',
  bio: '',
  image: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=500&q=80',
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  )
}

function AuthCard({ onSignedIn }: { onSignedIn: () => void }) {
  const [isClaimMode, setIsClaimMode] = useState(() => !hasModeratorAccount())
  const [name, setName] = useState('Moderator')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isClaimMode) {
        await claimModeratorAccount({ name, email, password })
      } else {
        await loginModerator({ email, password })
      }

      onSignedIn()
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Moderator access failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[78vh] flex items-center justify-center px-5 py-10">
      <section className="bg-surface rounded-2xl shadow-sm w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-navy mb-1">{isClaimMode ? 'Create moderator access' : 'Moderator login'}</h1>
        <p className="text-sm text-muted mb-6">
          {isClaimMode ? 'Set up your private moderator account on this browser.' : 'Login to update UniChase content.'}
        </p>
        <form onSubmit={submit} className="grid gap-4">
          {isClaimMode && (
            <Field label="Name">
              <input value={name} onChange={(event) => setName(event.target.value)} className={inputClass} required minLength={2} />
            </Field>
          )}
          <Field label="Email">
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" className={inputClass} required />
          </Field>
          <Field label="Password">
            <PasswordInput value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={isClaimMode ? 'new-password' : 'current-password'} className={inputClass} required minLength={8} />
          </Field>
          {error && <p className="text-sm text-red-500" role="alert">{error}</p>}
          <button type="submit" disabled={loading} className="bg-navy text-white rounded-lg px-5 py-2 font-semibold hover:bg-navy-light transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {isClaimMode ? 'Create moderator' : 'Login'}
          </button>
        </form>
        {hasModeratorAccount() && (
          <button type="button" onClick={() => setIsClaimMode((current) => !current)} className="mt-5 text-sm text-teal hover:underline">
            {isClaimMode ? 'Already created? Login' : 'Need to create access?'}
          </button>
        )}
      </section>
    </div>
  )
}

export default function Moderator() {
  const [session, setSession] = useState(() => getModeratorSession())
  const [tab, setTab] = useState<ModeratorTab>('news')
  const [newsItems, setNewsItems] = useState(() => getManagedNews())
  const [forumItems, setForumItems] = useState(() => getManagedForumPosts())
  const [qaItems, setQaItems] = useState(() => getManagedQaPosts())
  const [members, setMembers] = useState(() => getManagedMembers())
  const [newsForm, setNewsForm] = useState<NewsArticle>(blankNews)
  const [forumForm, setForumForm] = useState<ForumPost>(blankForumPost)
  const [qaForm, setQaForm] = useState<QAPost>(blankQaPost)
  const [memberForm, setMemberForm] = useState<SocietyMember>(blankMember)
  const [status, setStatus] = useState('')

  if (!session) {
    return <AuthCard onSignedIn={() => setSession(getModeratorSession())} />
  }

  const signOut = () => {
    logoutModerator()
    setSession(null)
  }

  const saveNews = () => {
    const item = { ...newsForm, id: newsForm.id || createNextId(newsItems) }
    const next = [item, ...newsItems.filter((entry) => entry.id !== item.id)]
    setNewsItems(next)
    setManagedNews(next)
    setNewsForm(blankNews)
    setStatus('News saved.')
  }

  const saveForum = () => {
    const item = { ...forumForm, id: forumForm.id || createNextId(forumItems), replies: Number(forumForm.replies) || 0 }
    const next = [item, ...forumItems.filter((entry) => entry.id !== item.id)]
    setForumItems(next)
    setManagedForumPosts(next)
    setForumForm(blankForumPost)
    setStatus('Community post saved.')
  }

  const saveQa = () => {
    const item = { ...qaForm, id: qaForm.id || createNextId(qaItems), answers: Number(qaForm.answers) || 0 }
    const next = [item, ...qaItems.filter((entry) => entry.id !== item.id)]
    setQaItems(next)
    setManagedQaPosts(next)
    setQaForm(blankQaPost)
    setStatus('Q&A post saved.')
  }

  const saveMember = () => {
    const item = { ...memberForm, id: memberForm.id || createNextId(members) }
    const next = [item, ...members.filter((entry) => entry.id !== item.id)]
    setMembers(next)
    setManagedMembers(next)
    setMemberForm(blankMember)
    setStatus('Society member saved.')
  }

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 py-10">
      <header className="flex items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-teal mb-2">Moderator</p>
          <h1 className="text-3xl font-bold text-navy">Content Manager</h1>
          <p className="text-sm text-muted mt-2">Signed in as {session.name} - {session.email}</p>
        </div>
        <button onClick={signOut} className="text-sm text-muted hover:text-teal transition-colors flex items-center gap-2">
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Logout
        </button>
      </header>

      <div className="flex gap-1 bg-surface p-1 rounded-xl shadow-sm mb-6 overflow-x-auto">
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setTab(item.id)
              setStatus('')
            }}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${tab === item.id ? 'bg-navy text-white' : 'text-muted hover:text-ink'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {status && <p className="bg-teal/10 text-teal text-sm rounded-lg px-4 py-3 mb-5">{status}</p>}

      {tab === 'news' && (
        <ContentEditor
          title="News"
          onSave={saveNews}
          onReset={() => {
            resetManagedNews()
            setNewsItems(getManagedNews())
            setNewsForm(blankNews)
            setStatus('News reset to defaults.')
          }}
        >
          <NewsForm form={newsForm} setForm={setNewsForm} />
          <ItemList
            items={newsItems}
            getTitle={(item) => item.title}
            onEdit={setNewsForm}
            onDelete={(item) => {
              const next = newsItems.filter((entry) => entry.id !== item.id)
              setNewsItems(next)
              setManagedNews(next)
            }}
          />
        </ContentEditor>
      )}

      {tab === 'forum' && (
        <ContentEditor title="Community" onSave={saveForum} onReset={() => {
          resetManagedForumPosts()
          setForumItems(getManagedForumPosts())
          setForumForm(blankForumPost)
          setStatus('Community reset to defaults.')
        }}>
          <ForumForm form={forumForm} setForm={setForumForm} />
          <ItemList items={forumItems} getTitle={(item) => item.title} onEdit={setForumForm} onDelete={(item) => {
            const next = forumItems.filter((entry) => entry.id !== item.id)
            setForumItems(next)
            setManagedForumPosts(next)
          }} />
        </ContentEditor>
      )}

      {tab === 'qa' && (
        <ContentEditor title="Q&A" onSave={saveQa} onReset={() => {
          resetManagedQaPosts()
          setQaItems(getManagedQaPosts())
          setQaForm(blankQaPost)
          setStatus('Q&A reset to defaults.')
        }}>
          <QaForm form={qaForm} setForm={setQaForm} />
          <ItemList items={qaItems} getTitle={(item) => item.title} onEdit={setQaForm} onDelete={(item) => {
            const next = qaItems.filter((entry) => entry.id !== item.id)
            setQaItems(next)
            setManagedQaPosts(next)
          }} />
        </ContentEditor>
      )}

      {tab === 'members' && (
        <ContentEditor title="Society Members" onSave={saveMember} onReset={() => {
          resetManagedMembers()
          setMembers(getManagedMembers())
          setMemberForm(blankMember)
          setStatus('Members reset to defaults.')
        }}>
          <MemberForm form={memberForm} setForm={setMemberForm} />
          <ItemList items={members} getTitle={(item) => item.name} onEdit={setMemberForm} onDelete={(item) => {
            const next = members.filter((entry) => entry.id !== item.id)
            setMembers(next)
            setManagedMembers(next)
          }} />
        </ContentEditor>
      )}
    </div>
  )
}

function ContentEditor({ title, children, onSave, onReset }: { title: string; children: ReactNode; onSave: () => void; onReset: () => void }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
      <section className="bg-surface rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between gap-3 mb-5">
          <h2 className="text-lg font-bold text-navy">Edit {title}</h2>
          <div className="flex gap-2">
            <button onClick={onReset} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-muted hover:text-teal transition-colors flex items-center gap-2">
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reset
            </button>
            <button onClick={onSave} className="bg-navy text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-navy-light transition-colors flex items-center gap-2">
              <Save className="h-4 w-4" aria-hidden="true" />
              Save
            </button>
          </div>
        </div>
        {Array.isArray(children) ? children[0] : children}
      </section>
      <aside className="bg-surface rounded-2xl shadow-sm p-5">
        <h2 className="text-lg font-bold text-navy mb-4">Published</h2>
        {Array.isArray(children) ? children[1] : null}
      </aside>
    </div>
  )
}

function ItemList<T extends { id: number }>({ items, getTitle, onEdit, onDelete }: { items: T[]; getTitle: (item: T) => string; onEdit: (item: T) => void; onDelete: (item: T) => void }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 p-3">
          <button onClick={() => onEdit(item)} className="text-left text-sm font-medium text-navy hover:text-teal transition-colors truncate">
            {getTitle(item) || 'Untitled'}
          </button>
          <button onClick={() => onDelete(item)} aria-label="Delete item" className="text-muted hover:text-red-500 transition-colors">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  )
}

function NewsForm({ form, setForm }: { form: NewsArticle; setForm: (form: NewsArticle) => void }) {
  return (
    <div className="grid gap-4">
      <Field label="Title"><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className={inputClass} /></Field>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Category"><input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className={inputClass} /></Field>
        <Field label="Read time"><input value={form.readTime} onChange={(event) => setForm({ ...form, readTime: event.target.value })} className={inputClass} /></Field>
        <Field label="Date"><input value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className={inputClass} /></Field>
      </div>
      <Field label="Excerpt"><textarea value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} className={inputClass} rows={2} /></Field>
      <Field label="Content"><textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} className={inputClass} rows={8} /></Field>
      <Field label="Image URL"><input value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} className={inputClass} /></Field>
      <Field label="Author"><input value={form.author} onChange={(event) => setForm({ ...form, author: event.target.value })} className={inputClass} /></Field>
    </div>
  )
}

function ForumForm({ form, setForm }: { form: ForumPost; setForm: (form: ForumPost) => void }) {
  return (
    <div className="grid gap-4">
      <Field label="Title"><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className={inputClass} /></Field>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Tag"><input value={form.tag} onChange={(event) => setForm({ ...form, tag: event.target.value })} className={inputClass} /></Field>
        <Field label="Replies"><input value={form.replies} onChange={(event) => setForm({ ...form, replies: Number(event.target.value) })} type="number" min={0} className={inputClass} /></Field>
        <Field label="Date"><input value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className={inputClass} /></Field>
      </div>
      <Field label="Content"><textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} className={inputClass} rows={8} /></Field>
      <Field label="Author"><input value={form.author} onChange={(event) => setForm({ ...form, author: event.target.value })} className={inputClass} /></Field>
      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={Boolean(form.isNew)} onChange={(event) => setForm({ ...form, isNew: event.target.checked })} className="h-4 w-4 rounded border-gray-300 text-teal focus:ring-teal" />
        Mark as new
      </label>
    </div>
  )
}

function QaForm({ form, setForm }: { form: QAPost; setForm: (form: QAPost) => void }) {
  return (
    <div className="grid gap-4">
      <Field label="Question"><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className={inputClass} /></Field>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Answers"><input value={form.answers} onChange={(event) => setForm({ ...form, answers: Number(event.target.value) })} type="number" min={0} className={inputClass} /></Field>
        <Field label="Date"><input value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className={inputClass} /></Field>
        <Field label="Author"><input value={form.author} onChange={(event) => setForm({ ...form, author: event.target.value })} className={inputClass} /></Field>
      </div>
      <Field label="Content"><textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} className={inputClass} rows={8} /></Field>
      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={form.solved} onChange={(event) => setForm({ ...form, solved: event.target.checked })} className="h-4 w-4 rounded border-gray-300 text-teal focus:ring-teal" />
        Mark as solved
      </label>
    </div>
  )
}

function MemberForm({ form, setForm }: { form: SocietyMember; setForm: (form: SocietyMember) => void }) {
  return (
    <div className="grid gap-4">
      <Field label="Name"><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass} /></Field>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Role"><input value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className={inputClass} /></Field>
        <Field label="Country"><input value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} className={inputClass} /></Field>
        <Field label="University"><input value={form.university} onChange={(event) => setForm({ ...form, university: event.target.value })} className={inputClass} /></Field>
      </div>
      <Field label="Bio"><textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} className={inputClass} rows={5} /></Field>
      <Field label="Image URL"><input value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} className={inputClass} /></Field>
    </div>
  )
}
