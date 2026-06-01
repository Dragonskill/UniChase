import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Loader2, LogOut, RotateCcw, Save, Trash2 } from 'lucide-react'
import PasswordInput from '@/components/auth/PasswordInput'
import GlowLetters from '@/components/ui/GlowLetters'
import type { ForumPost, QAPost } from '@/data/community'
import type { NewsArticle } from '@/data/news'
import type { StudentCouncil, StudentCouncilRole, University } from '@/data/universities'
import {
  createModeratorStudentCouncil,
  createModeratorStudentCouncilRole,
  deleteModeratorStudentCouncil,
  deleteModeratorStudentCouncilRole,
  fetchModeratorActivityLogs,
  fetchModeratorAnalyticsOverview,
  fetchModeratorQueue,
  fetchModeratorTopUniversities,
  fetchStudentCouncils,
  fetchUniversities,
  loginAdmin,
  saveModeratorProfile,
  sendModeratorAnnouncement,
  updateModeratorCommentStatus,
  updateModeratorPostStatus,
  updateModeratorUniversityImages,
  updateModeratorStudentCouncil,
  updateModeratorStudentCouncilRole,
  type StudentCouncilInput,
  type StudentCouncilRoleInput,
  type UniversityImageInput,
  type ModeratorQueue,
} from '@/lib/api'
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
  setModeratorSession,
} from '@/lib/moderatorAuth'

type ModeratorTab = 'news' | 'forum' | 'qa' | 'members' | 'student-councils' | 'platform'

const tabs: { id: ModeratorTab; label: string }[] = [
  { id: 'news', label: 'News' },
  { id: 'forum', label: 'Community' },
  { id: 'qa', label: 'Q&A' },
  { id: 'members', label: 'Society Members' },
  { id: 'student-councils', label: 'Student Councils' },
  { id: 'platform', label: 'Platform Ops' },
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

const blankCouncilForm: StudentCouncilInput = {
  universityId: 0,
  name: '',
  officialName: '',
  description: '',
  websiteUrl: '',
  socialUrl: '',
  contactEmail: '',
  sourceUrl: '',
  verificationStatus: 'needs verification',
  lastVerifiedAt: '',
}

const blankRoleForm: StudentCouncilRoleInput = {
  councilId: 0,
  universityId: 0,
  adminUserId: null,
  displayName: '',
  roleTitle: 'International Student Representative',
  department: '',
  description: '',
  responsibilities: [],
  contactEmail: '',
  contactUrl: '',
  avatarUrl: '',
  status: 'pending',
  verificationStatus: 'needs verification',
  sourceUrl: '',
}

const blankImageForm: UniversityImageInput = {
  imageUrl: '',
  campusImageUrl: '',
  logoUrl: '',
  imageAlt: '',
  imageSourceUrl: '',
  imageLastVerifiedAt: '',
  lastVerifiedAt: '',
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

  const signInWithBackend = async () => {
    const adminSession = await loginAdmin({ email, password })
    setModeratorSession({
      adminId: adminSession.admin.id,
      name: adminSession.admin.email,
      email: adminSession.admin.email,
      token: adminSession.token,
    })
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isClaimMode) {
        try {
          await signInWithBackend()
        } catch {
          await claimModeratorAccount({ name, email, password })
        }
      } else {
        try {
          await signInWithBackend()
        } catch {
          await loginModerator({ email, password })
        }
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
        <GlowLetters as="h1" text={isClaimMode ? 'Create moderator access' : 'Moderator login'} variant="title" className="text-2xl font-bold text-navy mb-1" />
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
  const [universities, setUniversities] = useState<University[]>([])
  const [studentCouncils, setStudentCouncils] = useState<StudentCouncil[]>([])
  const [moderatorQueue, setModeratorQueue] = useState<ModeratorQueue | null>(null)
  const [analyticsOverview, setAnalyticsOverview] = useState<Record<string, unknown> | null>(null)
  const [topUniversities, setTopUniversities] = useState<{ university?: { id: number; name: string; city: string }; count: number }[]>([])
  const [activityLogs, setActivityLogs] = useState<unknown[]>([])
  const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '', priority: 'normal', linkUrl: '/dashboard' })
  const [councilForm, setCouncilForm] = useState<StudentCouncilInput>(blankCouncilForm)
  const [roleForm, setRoleForm] = useState<StudentCouncilRoleInput>(blankRoleForm)
  const [imageForm, setImageForm] = useState<UniversityImageInput>(blankImageForm)
  const [profileForm, setProfileForm] = useState({
    displayName: session?.name || '',
    description: '',
    defaultRole: 'International Student Representative',
    avatarUrl: '',
    contactEmail: session?.email || '',
  })
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (!session?.token) {
      return
    }

    fetchUniversities().then(setUniversities).catch(() => undefined)
    fetchStudentCouncils().then(setStudentCouncils).catch(() => undefined)
  }, [session?.token])

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

  const refreshStudentCouncils = () => {
    if (session?.token) {
      fetchStudentCouncils().then(setStudentCouncils).catch(() => undefined)
    }
  }

  const refreshPlatformOps = () => {
    if (!session?.token) return

    fetchModeratorQueue(session.token).then(setModeratorQueue).catch(() => undefined)
    fetchModeratorAnalyticsOverview(session.token).then(setAnalyticsOverview).catch(() => undefined)
    fetchModeratorTopUniversities(session.token).then(setTopUniversities).catch(() => undefined)
    fetchModeratorActivityLogs(session.token).then(setActivityLogs).catch(() => undefined)
  }

  useEffect(() => {
    if (tab === 'platform' && session?.token) {
      fetchModeratorQueue(session.token).then(setModeratorQueue).catch(() => undefined)
      fetchModeratorAnalyticsOverview(session.token).then(setAnalyticsOverview).catch(() => undefined)
      fetchModeratorTopUniversities(session.token).then(setTopUniversities).catch(() => undefined)
      fetchModeratorActivityLogs(session.token).then(setActivityLogs).catch(() => undefined)
    }
  }, [tab, session?.token])

  if (!session) {
    return <AuthCard onSignedIn={() => setSession(getModeratorSession())} />
  }

  const saveCouncil = () => {
    if (!session?.token || !councilForm.universityId) {
      setStatus('Backend admin login and university selection are required.')
      return
    }

    const existing = studentCouncils.find((council) => council.universityId === Number(councilForm.universityId))
    const action = existing
      ? updateModeratorStudentCouncil(session.token, existing.id, councilForm)
      : createModeratorStudentCouncil(session.token, councilForm)

    action
      .then((council) => {
        setCouncilForm({
          ...blankCouncilForm,
          universityId: council.universityId,
          name: council.name,
          officialName: council.officialName || '',
          description: council.description,
          websiteUrl: council.websiteUrl || '',
          socialUrl: council.socialUrl || '',
          contactEmail: council.contactEmail || '',
          sourceUrl: council.sourceUrl || '',
          verificationStatus: council.verificationStatus,
          lastVerifiedAt: council.lastVerifiedAt || '',
        })
        refreshStudentCouncils()
        setStatus('Student council saved.')
      })
      .catch(() => setStatus('Could not save student council.'))
  }

  const saveUniversityImages = () => {
    if (!session?.token || !councilForm.universityId) {
      setStatus('Backend admin login and university selection are required.')
      return
    }

    updateModeratorUniversityImages(session.token, Number(councilForm.universityId), imageForm)
      .then((university) => {
        setUniversities((current) => current.map((item) => (item.id === university.id ? university : item)))
        setImageForm({
          imageUrl: university.imageUrl || '',
          campusImageUrl: university.campusImageUrl || '',
          logoUrl: university.logoUrl || '',
          imageAlt: university.imageAlt || '',
          imageSourceUrl: university.imageSourceUrl || '',
          imageLastVerifiedAt: (university.imageLastVerifiedAt || '').slice(0, 10),
          lastVerifiedAt: (university.lastVerifiedAt || '').slice(0, 10),
        })
        setStatus('University image data saved.')
      })
      .catch(() => setStatus('Could not save university image data.'))
  }

  const saveCouncilRole = () => {
    if (!session?.token || !roleForm.councilId || !roleForm.universityId) {
      setStatus('Backend admin login, council, and university are required.')
      return
    }

    createModeratorStudentCouncilRole(session.token, roleForm)
      .then(() => {
        setRoleForm({ ...blankRoleForm, councilId: roleForm.councilId, universityId: roleForm.universityId })
        refreshStudentCouncils()
        setStatus('Student council role saved.')
      })
      .catch(() => setStatus('Could not save student council role.'))
  }

  const updateRoleStatus = (role: StudentCouncilRole, data: Partial<StudentCouncilRoleInput>) => {
    if (!session?.token) {
      return
    }

    updateModeratorStudentCouncilRole(session.token, role.id, data)
      .then(refreshStudentCouncils)
      .catch(() => setStatus('Could not update role.'))
  }

  const removeCouncil = (council: StudentCouncil) => {
    if (!session?.token) {
      return
    }

    deleteModeratorStudentCouncil(session.token, council.id)
      .then(() => {
        refreshStudentCouncils()
        setStatus('Student council deleted.')
      })
      .catch(() => setStatus('Could not delete student council.'))
  }

  const removeCouncilRole = (role: StudentCouncilRole) => {
    if (!session?.token) {
      return
    }

    deleteModeratorStudentCouncilRole(session.token, role.id)
      .then(() => {
        refreshStudentCouncils()
        setStatus('Student council role deleted.')
      })
      .catch(() => setStatus('Could not delete student council role.'))
  }

  const saveProfile = () => {
    if (!session?.token) {
      setStatus('Backend admin login is required to save moderator profile.')
      return
    }

    saveModeratorProfile(session.token, profileForm)
      .then(() => setStatus('Moderator profile saved.'))
      .catch(() => setStatus('Could not save moderator profile.'))
  }

  const moderatePost = (id: number, data: { status?: string; pinned?: boolean; officialAnswer?: string | null }) => {
    if (!session?.token) return
    updateModeratorPostStatus(session.token, id, data)
      .then(() => {
        refreshPlatformOps()
        setStatus('Post moderation saved.')
      })
      .catch(() => setStatus('Could not moderate post.'))
  }

  const moderateComment = (id: number, data: { status?: string; official?: boolean }) => {
    if (!session?.token) return
    updateModeratorCommentStatus(session.token, id, data)
      .then(() => {
        refreshPlatformOps()
        setStatus('Comment moderation saved.')
      })
      .catch(() => setStatus('Could not moderate comment.'))
  }

  const sendAnnouncement = () => {
    if (!session?.token) return
    sendModeratorAnnouncement(session.token, announcementForm)
      .then(() => {
        setAnnouncementForm({ title: '', message: '', priority: 'normal', linkUrl: '/dashboard' })
        setStatus('Announcement sent.')
      })
      .catch(() => setStatus('Could not send announcement.'))
  }

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 py-10">
      <header className="flex items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-teal mb-2">Moderator</p>
          <GlowLetters as="h1" text="Content Manager" variant="title" className="text-3xl font-bold text-navy" />
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

      {tab === 'student-councils' && (
        <StudentCouncilManager
          token={session.token}
          adminId={session.adminId}
          universities={universities}
          councils={studentCouncils}
          councilForm={councilForm}
          roleForm={roleForm}
          imageForm={imageForm}
          profileForm={profileForm}
          setCouncilForm={setCouncilForm}
          setRoleForm={setRoleForm}
          setImageForm={setImageForm}
          setProfileForm={setProfileForm}
          onSaveCouncil={saveCouncil}
          onSaveUniversityImages={saveUniversityImages}
          onSaveRole={saveCouncilRole}
          onSaveProfile={saveProfile}
          onEditCouncil={(council) => {
            setCouncilForm({
              universityId: council.universityId,
              name: council.name,
              officialName: council.officialName || '',
              description: council.description,
              websiteUrl: council.websiteUrl || '',
              socialUrl: council.socialUrl || '',
              contactEmail: council.contactEmail || '',
              sourceUrl: council.sourceUrl || '',
              verificationStatus: council.verificationStatus,
              lastVerifiedAt: council.lastVerifiedAt || '',
            })
            setRoleForm({ ...blankRoleForm, councilId: council.id, universityId: council.universityId })
            const university = universities.find((item) => item.id === council.universityId)
            setImageForm({
              imageUrl: university?.imageUrl || '',
              campusImageUrl: university?.campusImageUrl || '',
              logoUrl: university?.logoUrl || '',
              imageAlt: university?.imageAlt || `${university?.name || ''} campus image`,
              imageSourceUrl: university?.imageSourceUrl || university?.officialWebsite || '',
              imageLastVerifiedAt: (university?.imageLastVerifiedAt || '').slice(0, 10),
              lastVerifiedAt: (university?.lastVerifiedAt || '').slice(0, 10),
            })
          }}
          onDeleteCouncil={removeCouncil}
          onDeleteRole={removeCouncilRole}
          onUpdateRole={updateRoleStatus}
        />
      )}

      {tab === 'platform' && (
        <PlatformOpsPanel
          queue={moderatorQueue}
          analyticsOverview={analyticsOverview}
          topUniversities={topUniversities}
          activityLogs={activityLogs}
          announcementForm={announcementForm}
          setAnnouncementForm={setAnnouncementForm}
          onRefresh={refreshPlatformOps}
          onModeratePost={moderatePost}
          onModerateComment={moderateComment}
          onSendAnnouncement={sendAnnouncement}
        />
      )}
    </div>
  )
}

function PlatformOpsPanel({
  queue,
  analyticsOverview,
  topUniversities,
  activityLogs,
  announcementForm,
  setAnnouncementForm,
  onRefresh,
  onModeratePost,
  onModerateComment,
  onSendAnnouncement,
}: {
  queue: ModeratorQueue | null
  analyticsOverview: Record<string, unknown> | null
  topUniversities: { university?: { id: number; name: string; city: string }; count: number }[]
  activityLogs: unknown[]
  announcementForm: { title: string; message: string; priority: string; linkUrl: string }
  setAnnouncementForm: (form: { title: string; message: string; priority: string; linkUrl: string }) => void
  onRefresh: () => void
  onModeratePost: (id: number, data: { status?: string; pinned?: boolean; officialAnswer?: string | null }) => void
  onModerateComment: (id: number, data: { status?: string; official?: boolean }) => void
  onSendAnnouncement: () => void
}) {
  const overviewItems: Array<[string, unknown]> = [
    ['Events', analyticsOverview?.events],
    ['Users', analyticsOverview?.users],
    ['Community posts', analyticsOverview?.posts],
    ['Pending reports', queue?.reports?.length || 0],
  ]

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      <section className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-navy">Advanced moderation</h2>
          <button onClick={onRefresh} className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">Refresh queue</button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {overviewItems.map(([label, value]) => (
            <article key={label} className="bg-surface rounded-2xl shadow-sm p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
              <p className="mt-2 text-2xl font-bold text-navy">{String(value ?? 0)}</p>
            </article>
          ))}
        </div>

        <QueueSection title="Pending posts" empty="No pending posts.">
          {queue?.pendingPosts?.map((post) => (
            <QueueRow key={post.id} title={post.title} meta={`${post.category} - ${post.author?.name || 'Student'}`}>
              <button onClick={() => onModeratePost(post.id, { status: 'published' })} className="text-xs text-teal hover:underline">Approve</button>
              <button onClick={() => onModeratePost(post.id, { status: 'hidden' })} className="text-xs text-muted hover:text-teal">Hide</button>
              <button onClick={() => onModeratePost(post.id, { pinned: !post.pinned })} className="text-xs text-muted hover:text-teal">{post.pinned ? 'Unpin' : 'Pin'}</button>
            </QueueRow>
          ))}
        </QueueSection>

        <QueueSection title="Reported posts" empty="No reported posts.">
          {queue?.reportedPosts?.map((post) => (
            <QueueRow key={post.id} title={post.title} meta={`${post.category} - ${post.author?.name || 'Student'}`}>
              <button onClick={() => onModeratePost(post.id, { status: 'published' })} className="text-xs text-teal hover:underline">Restore</button>
              <button onClick={() => onModeratePost(post.id, { status: 'hidden' })} className="text-xs text-muted hover:text-teal">Hide</button>
              <button onClick={() => onModeratePost(post.id, { status: 'removed' })} className="text-xs text-muted hover:text-teal">Remove</button>
            </QueueRow>
          ))}
        </QueueSection>

        <QueueSection title="Reported comments" empty="No reported comments.">
          {queue?.reportedComments?.map((comment) => (
            <QueueRow key={comment.id} title={comment.content.slice(0, 120)} meta={`Post #${comment.postId}`}>
              <button onClick={() => onModerateComment(comment.id, { status: 'published' })} className="text-xs text-teal hover:underline">Restore</button>
              <button onClick={() => onModerateComment(comment.id, { status: 'hidden' })} className="text-xs text-muted hover:text-teal">Hide</button>
              <button onClick={() => onModerateComment(comment.id, { official: true })} className="text-xs text-muted hover:text-teal">Official</button>
            </QueueRow>
          ))}
        </QueueSection>

        <QueueSection title="Verification queue" empty="Nothing needs verification.">
          {queue?.verificationQueue?.map((item) => (
            <QueueRow key={item.id} title={item.name} meta={item.campusImageUrl ? 'Image present, needs verification date' : 'Missing campus image'}>
              <span className="text-xs text-muted">Use Student Councils tab image editor</span>
            </QueueRow>
          ))}
        </QueueSection>
      </section>

      <aside className="space-y-6">
        <section className="bg-surface rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-navy">Announcement</h2>
          <div className="mt-3 grid gap-3">
            <input value={announcementForm.title} onChange={(event) => setAnnouncementForm({ ...announcementForm, title: event.target.value })} placeholder="Title" className={inputClass} />
            <textarea value={announcementForm.message} onChange={(event) => setAnnouncementForm({ ...announcementForm, message: event.target.value })} placeholder="Message" rows={4} className={inputClass} />
            <select value={announcementForm.priority} onChange={(event) => setAnnouncementForm({ ...announcementForm, priority: event.target.value })} className={inputClass}>
              {['low', 'normal', 'high', 'urgent'].map((priority) => <option key={priority}>{priority}</option>)}
            </select>
            <input value={announcementForm.linkUrl} onChange={(event) => setAnnouncementForm({ ...announcementForm, linkUrl: event.target.value })} placeholder="/dashboard" className={inputClass} />
            <button onClick={onSendAnnouncement} className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-light">Send to users</button>
          </div>
        </section>

        <section className="bg-surface rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-navy">Top universities</h2>
          <div className="mt-3 space-y-2">
            {topUniversities.length === 0 && <p className="text-sm text-muted">Analytics will appear after events are tracked.</p>}
            {topUniversities.map((item) => (
              <div key={item.university?.id || item.count} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-navy">{item.university?.name || 'Unknown university'}</span>
                <span className="text-muted">{item.count}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-surface rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-navy">Activity logs</h2>
          <div className="mt-3 space-y-2">
            {activityLogs.slice(0, 8).map((entry, index) => {
              const log = entry as { actionType?: string; targetEntity?: string; createdAt?: string }
              return (
                <p key={`${log.actionType}-${index}`} className="text-xs text-muted">
                  {log.actionType || 'activity'} - {log.targetEntity || 'target'} {log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}
                </p>
              )
            })}
            {activityLogs.length === 0 && <p className="text-sm text-muted">No activity logs yet.</p>}
          </div>
        </section>
      </aside>
    </div>
  )
}

function QueueSection({ title, empty, children }: { title: string; empty: string; children: ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.some(Boolean) : Boolean(children)

  return (
    <section className="bg-surface rounded-2xl shadow-sm p-5">
      <h3 className="text-lg font-bold text-navy">{title}</h3>
      <div className="mt-3 space-y-2">
        {hasChildren ? children : <p className="text-sm text-muted">{empty}</p>}
      </div>
    </section>
  )
}

function QueueRow({ title, meta, children }: { title: string; meta: string; children: ReactNode }) {
  return (
    <article className="rounded-xl border border-gray-100 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-navy line-clamp-1">{title}</p>
          <p className="mt-1 text-xs text-muted">{meta}</p>
        </div>
        <div className="flex flex-wrap gap-2">{children}</div>
      </div>
    </article>
  )
}

type ProfileForm = {
  displayName: string
  description: string
  defaultRole: string
  avatarUrl: string
  contactEmail: string
}

function StudentCouncilManager({
  token,
  adminId,
  universities,
  councils,
  councilForm,
  roleForm,
  imageForm,
  profileForm,
  setCouncilForm,
  setRoleForm,
  setImageForm,
  setProfileForm,
  onSaveCouncil,
  onSaveUniversityImages,
  onSaveRole,
  onSaveProfile,
  onEditCouncil,
  onDeleteCouncil,
  onDeleteRole,
  onUpdateRole,
}: {
  token?: string
  adminId?: number
  universities: University[]
  councils: StudentCouncil[]
  councilForm: StudentCouncilInput
  roleForm: StudentCouncilRoleInput
  imageForm: UniversityImageInput
  profileForm: ProfileForm
  setCouncilForm: (form: StudentCouncilInput) => void
  setRoleForm: (form: StudentCouncilRoleInput) => void
  setImageForm: (form: UniversityImageInput) => void
  setProfileForm: (form: ProfileForm) => void
  onSaveCouncil: () => void
  onSaveUniversityImages: () => void
  onSaveRole: () => void
  onSaveProfile: () => void
  onEditCouncil: (council: StudentCouncil) => void
  onDeleteCouncil: (council: StudentCouncil) => void
  onDeleteRole: (role: StudentCouncilRole) => void
  onUpdateRole: (role: StudentCouncilRole, data: Partial<StudentCouncilRoleInput>) => void
}) {
  const selectedCouncil = councils.find((council) => council.id === Number(roleForm.councilId))
  const selectedUniversity = universities.find((university) => university.id === Number(councilForm.universityId))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6">
      <section className="bg-surface rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-lg font-bold text-navy">Student Council Management</h2>
            <p className="text-sm text-muted">Use verified public sources, or mark placeholders as needing verification.</p>
          </div>
          {!token && <span className="text-xs bg-cream border border-gray-200 rounded-full px-3 py-1 text-muted">Backend admin login required</span>}
        </div>

        <div className="grid gap-6">
          <div className="grid gap-4">
            <h3 className="text-sm font-semibold text-navy">Council profile</h3>
            <Field label="University">
              <select
                value={councilForm.universityId}
                onChange={(event) => {
                  const universityId = Number(event.target.value)
                  const university = universities.find((item) => item.id === universityId)
                  const existing = councils.find((item) => item.universityId === universityId)
                  setCouncilForm({
                    ...councilForm,
                    universityId,
                    name: existing?.name || (university ? `${university.name} Student Council` : ''),
                    description: existing?.description || councilForm.description,
                    sourceUrl: existing?.sourceUrl || university?.officialWebsite || '',
                    verificationStatus: existing?.verificationStatus || 'needs verification',
                  })
                  if (existing) {
                    setRoleForm({ ...roleForm, councilId: existing.id, universityId })
                  }
                  setImageForm({
                    imageUrl: university?.imageUrl || '',
                    campusImageUrl: university?.campusImageUrl || '',
                    logoUrl: university?.logoUrl || '',
                    imageAlt: university?.imageAlt || (university ? `${university.name} campus image` : ''),
                    imageSourceUrl: university?.imageSourceUrl || university?.officialWebsite || '',
                    imageLastVerifiedAt: (university?.imageLastVerifiedAt || '').slice(0, 10),
                    lastVerifiedAt: (university?.lastVerifiedAt || '').slice(0, 10),
                  })
                }}
                className={inputClass}
                disabled={!token}
              >
                <option value={0}>Choose university</option>
                {universities.map((university) => (
                  <option key={university.id} value={university.id}>{university.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Council name">
              <input value={councilForm.name} onChange={(event) => setCouncilForm({ ...councilForm, name: event.target.value })} className={inputClass} disabled={!token} />
            </Field>
            <Field label="Official name">
              <input value={councilForm.officialName || ''} onChange={(event) => setCouncilForm({ ...councilForm, officialName: event.target.value })} className={inputClass} disabled={!token} />
            </Field>
            <Field label="Description">
              <textarea value={councilForm.description} onChange={(event) => setCouncilForm({ ...councilForm, description: event.target.value })} className={inputClass} rows={4} disabled={!token} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Website URL"><input value={councilForm.websiteUrl || ''} onChange={(event) => setCouncilForm({ ...councilForm, websiteUrl: event.target.value })} className={inputClass} disabled={!token} /></Field>
              <Field label="Social URL"><input value={councilForm.socialUrl || ''} onChange={(event) => setCouncilForm({ ...councilForm, socialUrl: event.target.value })} className={inputClass} disabled={!token} /></Field>
              <Field label="Contact email"><input value={councilForm.contactEmail || ''} onChange={(event) => setCouncilForm({ ...councilForm, contactEmail: event.target.value })} className={inputClass} disabled={!token} /></Field>
              <Field label="Source URL"><input value={councilForm.sourceUrl || ''} onChange={(event) => setCouncilForm({ ...councilForm, sourceUrl: event.target.value })} className={inputClass} disabled={!token} /></Field>
              <Field label="Verification">
                <select value={councilForm.verificationStatus || 'needs verification'} onChange={(event) => setCouncilForm({ ...councilForm, verificationStatus: event.target.value as StudentCouncil['verificationStatus'] })} className={inputClass} disabled={!token}>
                  <option value="needs verification">Needs verification</option>
                  <option value="manually added">Manually added</option>
                  <option value="verified">Verified</option>
                </select>
              </Field>
              <Field label="Last verified">
                <input type="date" value={(councilForm.lastVerifiedAt || '').slice(0, 10)} onChange={(event) => setCouncilForm({ ...councilForm, lastVerifiedAt: event.target.value })} className={inputClass} disabled={!token} />
              </Field>
            </div>
            <button onClick={onSaveCouncil} disabled={!token || !selectedUniversity} className="bg-navy text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-navy-light transition-colors disabled:opacity-60">
              Save council
            </button>
          </div>

          <div className="border-t border-gray-100 pt-6 grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-navy">University photos and verification</h3>
                <p className="text-xs text-muted">Add campus/logo URLs and source details without changing the public layout.</p>
              </div>
              {selectedUniversity && !(selectedUniversity.campusImageUrl || selectedUniversity.imageUrl) && (
                <span className="text-xs bg-cream border border-gray-200 rounded-full px-3 py-1 text-muted">Campus image missing</span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Campus image URL">
                <input value={imageForm.campusImageUrl || ''} onChange={(event) => setImageForm({ ...imageForm, campusImageUrl: event.target.value, imageUrl: event.target.value })} className={inputClass} disabled={!token || !selectedUniversity} />
              </Field>
              <Field label="Logo URL">
                <input value={imageForm.logoUrl || ''} onChange={(event) => setImageForm({ ...imageForm, logoUrl: event.target.value })} className={inputClass} disabled={!token || !selectedUniversity} />
              </Field>
              <Field label="Image alt text">
                <input value={imageForm.imageAlt || ''} onChange={(event) => setImageForm({ ...imageForm, imageAlt: event.target.value })} className={inputClass} disabled={!token || !selectedUniversity} />
              </Field>
              <Field label="Image source URL">
                <input value={imageForm.imageSourceUrl || ''} onChange={(event) => setImageForm({ ...imageForm, imageSourceUrl: event.target.value })} className={inputClass} disabled={!token || !selectedUniversity} />
              </Field>
              <Field label="Image verified">
                <input type="date" value={(imageForm.imageLastVerifiedAt || '').slice(0, 10)} onChange={(event) => setImageForm({ ...imageForm, imageLastVerifiedAt: event.target.value })} className={inputClass} disabled={!token || !selectedUniversity} />
              </Field>
              <Field label="University verified">
                <input type="date" value={(imageForm.lastVerifiedAt || '').slice(0, 10)} onChange={(event) => setImageForm({ ...imageForm, lastVerifiedAt: event.target.value })} className={inputClass} disabled={!token || !selectedUniversity} />
              </Field>
            </div>
            <button onClick={onSaveUniversityImages} disabled={!token || !selectedUniversity} className="bg-navy text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-navy-light transition-colors disabled:opacity-60">
              Save university images
            </button>
          </div>

          <div className="border-t border-gray-100 pt-6 grid gap-4">
            <h3 className="text-sm font-semibold text-navy">Role or member</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Council">
                <select
                  value={roleForm.councilId}
                  onChange={(event) => {
                    const councilId = Number(event.target.value)
                    const council = councils.find((item) => item.id === councilId)
                    setRoleForm({ ...roleForm, councilId, universityId: council?.universityId || 0 })
                  }}
                  className={inputClass}
                  disabled={!token}
                >
                  <option value={0}>Choose council</option>
                  {councils.map((council) => <option key={council.id} value={council.id}>{council.name}</option>)}
                </select>
              </Field>
              <Field label="Role title"><input value={roleForm.roleTitle} onChange={(event) => setRoleForm({ ...roleForm, roleTitle: event.target.value })} className={inputClass} disabled={!token} /></Field>
              <Field label="Display name"><input value={roleForm.displayName || ''} onChange={(event) => setRoleForm({ ...roleForm, displayName: event.target.value })} className={inputClass} disabled={!token} /></Field>
              <Field label="Department"><input value={roleForm.department || ''} onChange={(event) => setRoleForm({ ...roleForm, department: event.target.value })} className={inputClass} disabled={!token} /></Field>
              <Field label="Status">
                <select value={roleForm.status || 'pending'} onChange={(event) => setRoleForm({ ...roleForm, status: event.target.value as StudentCouncilRole['status'] })} className={inputClass} disabled={!token}>
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
              <Field label="Verification">
                <select value={roleForm.verificationStatus || 'needs verification'} onChange={(event) => setRoleForm({ ...roleForm, verificationStatus: event.target.value as StudentCouncilRole['verificationStatus'] })} className={inputClass} disabled={!token}>
                  <option value="needs verification">Needs verification</option>
                  <option value="manually added">Manually added</option>
                  <option value="verified">Verified</option>
                </select>
              </Field>
            </div>
            <Field label="Description"><textarea value={roleForm.description || ''} onChange={(event) => setRoleForm({ ...roleForm, description: event.target.value })} className={inputClass} rows={3} disabled={!token} /></Field>
            <Field label="Responsibilities">
              <textarea
                value={(roleForm.responsibilities || []).join('\n')}
                onChange={(event) => setRoleForm({ ...roleForm, responsibilities: event.target.value.split('\n').map((item) => item.trim()).filter(Boolean) })}
                className={inputClass}
                rows={3}
                disabled={!token}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Contact email"><input value={roleForm.contactEmail || ''} onChange={(event) => setRoleForm({ ...roleForm, contactEmail: event.target.value })} className={inputClass} disabled={!token} /></Field>
              <Field label="Contact URL"><input value={roleForm.contactUrl || ''} onChange={(event) => setRoleForm({ ...roleForm, contactUrl: event.target.value })} className={inputClass} disabled={!token} /></Field>
              <Field label="Avatar URL"><input value={roleForm.avatarUrl || ''} onChange={(event) => setRoleForm({ ...roleForm, avatarUrl: event.target.value })} className={inputClass} disabled={!token} /></Field>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                disabled={!token || !adminId}
                checked={roleForm.adminUserId === adminId}
                onChange={(event) => setRoleForm({
                  ...roleForm,
                  adminUserId: event.target.checked ? adminId || null : null,
                  displayName: event.target.checked ? profileForm.displayName : roleForm.displayName,
                  contactEmail: event.target.checked ? profileForm.contactEmail : roleForm.contactEmail,
                  avatarUrl: event.target.checked ? profileForm.avatarUrl : roleForm.avatarUrl,
                  verificationStatus: event.target.checked ? 'manually added' : roleForm.verificationStatus,
                })}
                className="h-4 w-4 rounded border-gray-300 text-teal focus:ring-teal"
              />
              Add myself as this role
            </label>
            <button onClick={onSaveRole} disabled={!token || !selectedCouncil} className="bg-navy text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-navy-light transition-colors disabled:opacity-60">
              Save role
            </button>
          </div>

          <div className="border-t border-gray-100 pt-6 grid gap-4">
            <h3 className="text-sm font-semibold text-navy">Moderator profile</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Display name"><input value={profileForm.displayName} onChange={(event) => setProfileForm({ ...profileForm, displayName: event.target.value })} className={inputClass} disabled={!token} /></Field>
              <Field label="Default role"><input value={profileForm.defaultRole} onChange={(event) => setProfileForm({ ...profileForm, defaultRole: event.target.value })} className={inputClass} disabled={!token} /></Field>
              <Field label="Contact email"><input value={profileForm.contactEmail} onChange={(event) => setProfileForm({ ...profileForm, contactEmail: event.target.value })} className={inputClass} disabled={!token} /></Field>
              <Field label="Avatar URL"><input value={profileForm.avatarUrl} onChange={(event) => setProfileForm({ ...profileForm, avatarUrl: event.target.value })} className={inputClass} disabled={!token} /></Field>
            </div>
            <Field label="Description"><textarea value={profileForm.description} onChange={(event) => setProfileForm({ ...profileForm, description: event.target.value })} className={inputClass} rows={3} disabled={!token} /></Field>
            <button onClick={onSaveProfile} disabled={!token} className="bg-navy text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-navy-light transition-colors disabled:opacity-60">
              Save moderator profile
            </button>
          </div>
        </div>
      </section>

      <aside className="bg-surface rounded-2xl shadow-sm p-5">
        <h2 className="text-lg font-bold text-navy mb-4">Councils</h2>
        <div className="space-y-3">
          {councils.map((council) => (
            <div key={council.id} className="rounded-lg border border-gray-100 p-3">
              <div className="flex items-start justify-between gap-3">
                <button onClick={() => onEditCouncil(council)} className="text-left text-sm font-medium text-navy hover:text-teal transition-colors">
                  {council.name}
                </button>
                <button onClick={() => onDeleteCouncil(council)} aria-label="Delete council" className="text-muted hover:text-red-500 transition-colors">
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <p className="text-xs text-muted mt-1">{council.verificationStatus}</p>
              <div className="mt-3 space-y-2">
                {(council.roles || []).map((role) => (
                  <div key={role.id} className="rounded border border-gray-100 p-2">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        onClick={() => setRoleForm({
                          councilId: council.id,
                          universityId: council.universityId,
                          adminUserId: role.adminUserId,
                          displayName: role.displayName || '',
                          roleTitle: role.roleTitle,
                          department: role.department || '',
                          description: role.description || '',
                          responsibilities: role.responsibilities || [],
                          contactEmail: role.contactEmail || '',
                          contactUrl: role.contactUrl || '',
                          avatarUrl: role.avatarUrl || '',
                          status: role.status,
                          verificationStatus: role.verificationStatus,
                          sourceUrl: role.sourceUrl || '',
                        })}
                        className="text-left text-xs font-medium text-navy hover:text-teal transition-colors"
                      >
                        {role.roleTitle}
                      </button>
                      <button onClick={() => onDeleteRole(role)} aria-label="Delete role" className="text-muted hover:text-red-500 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => onUpdateRole(role, { verificationStatus: 'verified' })} className="text-xs text-teal hover:underline">Verify</button>
                      <button onClick={() => onUpdateRole(role, { status: 'inactive' })} className="text-xs text-muted hover:underline">Inactive</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {councils.length === 0 && <p className="text-sm text-muted">Seeded councils will appear after the API is running.</p>}
        </div>
      </aside>
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
