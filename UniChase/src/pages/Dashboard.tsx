import { useEffect, useState } from "react"

import { Link } from "react-router-dom"

import { universities as catalog, type University } from "@/data/universities"

import {

  ApiRequestError,

  fetchUniversities,

  fetchFollowedUniversities,

  deleteApplication,

  deleteDocumentItem,

  createApplication,

  createDocumentItem,

  fetchAccountDeadlines,

  fetchApplications,

  fetchCalendarEvents,

  fetchChecklist,

  fetchDocuments,

  fetchOnboarding,

  fetchProfile,

  fetchSavedUniversities,

  updateChecklist,

  updateApplication,

  updateDocumentItem,

  updateProfile,

  type CalendarEventItem,

  type OnboardingPreference,

  type StudentUser,

  type UserApplication,

  type UserDocument,

} from "@/lib/api"

import { exportStudentToolPdf } from "@/lib/pdfExport"

import { applySeo } from "@/lib/seo"

import {

  authChangeEvent,

  getFollowedUniversityIds,

  clearToken,

  getCompareUniversityIds,

  getLocalDeadlines,

  getSavedUniversityIds,

  getStoredUser,

  getToken,

  setStoredUser,

} from "@/lib/storage"



type ChecklistItem = {

  id?: number

  title: string

  completed: boolean

}



export default function Dashboard() {

  const [sessionToken, setSessionToken] = useState(getToken)

  useEffect(() => { const sync = () => setSessionToken(getToken()); window.addEventListener(authChangeEvent, sync); return () => window.removeEventListener(authChangeEvent, sync) }, [])

  return <DashboardContent key={sessionToken || "guest"} />

}



function DashboardContent() {

  const [token, setTokenState] = useState(() => getToken())

  const [profile, setProfile] = useState<StudentUser | null>(() => getToken() ? getStoredUser<StudentUser>() : null)

  const [saved, setSaved] = useState<University[]>([])

  const [followed, setFollowed] = useState<University[]>([])

  const [directory, setDirectory] = useState<University[]>(catalog)

  const [loading, setLoading] = useState(true)

  const [compared, setCompared] = useState<University[]>([])

  const [checklist, setChecklist] = useState<ChecklistItem[]>([

    { title: "Choose target universities", completed: false },

    { title: "Prepare transcripts", completed: false },

    { title: "Check language requirements", completed: false },

    { title: "Track application deadlines", completed: false },

  ])

  const [deadlines, setDeadlines] = useState<{ deadlineType: string; important: boolean; university: University }[]>([])

  const [applications, setApplications] = useState<UserApplication[]>([])

  const [documents, setDocuments] = useState<UserDocument[]>([])

  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>([])

  const [onboarding, setOnboarding] = useState<OnboardingPreference | null>(null)

  const [applicationForm, setApplicationForm] = useState({ universityId: "", status: "Interested", intake: "", applicationDeadline: "" })

  const [documentForm, setDocumentForm] = useState({ documentType: "Passport", title: "Passport", status: "missing" })

  const [profileMessage, setProfileMessage] = useState("")



  useEffect(() => {

    applySeo({

      title: "Student Dashboard | UniChase",

      description: "View saved universities, comparisons, checklist, deadlines, recommendations, and profile information.",

      canonicalPath: "/dashboard",

    })

  }, [])



  useEffect(() => {

    let active = true

    const safe = <T,>(setter: (value: T) => void) => (value: T) => { if (active) setter(value) }

    const load = async () => {

      const universities = await fetchUniversities().catch(() => catalog)

      if (!active) return

      setDirectory(universities)

      setCompared(universities.filter(item => getCompareUniversityIds().includes(item.id)))

      if (!token) {

        setSaved(universities.filter(item => getSavedUniversityIds().includes(item.id)))

        setFollowed(universities.filter(item => getFollowedUniversityIds().includes(item.id)))

        setDeadlines(getLocalDeadlines().flatMap(item => { const university = universities.find(uni => uni.id === item.universityId); return university ? [{ ...item, university }] : [] }))

        try { const guest = JSON.parse(sessionStorage.getItem('unichase.guest.dashboard-checklist') || 'null'); if (Array.isArray(guest)) setChecklist(guest) } catch { /* Use the starter checklist. */ }

        setLoading(false); return

      }

      const results = await Promise.allSettled([

        fetchProfile(token).then(safe(setProfile)), fetchSavedUniversities(token).then(safe(setSaved)),

        fetchFollowedUniversities(token).then(safe(setFollowed)), fetchChecklist(token).then(safe(setChecklist)),

        fetchAccountDeadlines(token).then(safe(setDeadlines)), fetchApplications(token).then(safe(setApplications)),

        fetchDocuments(token).then(safe(setDocuments)), fetchCalendarEvents(token).then(safe(setCalendarEvents)), fetchOnboarding(token).then(safe(setOnboarding)),

      ])

      if (!active) return

      const failures = results.filter(result => result.status === 'rejected')

      if (failures.some(result => result.status === 'rejected' && result.reason instanceof ApiRequestError && result.reason.status === 401)) {

        clearToken(); setTokenState(null); setProfile(null)

      } else if (failures.length) setProfileMessage('Some dashboard sections could not load. Refresh to retry. Your saved data has not been changed.')

      setLoading(false)

    }

    void load()

    return () => { active = false }

  }, [token])



  const toggleChecklist = async (index: number) => {

    const next = checklist.map((item, itemIndex) => itemIndex === index ? { ...item, completed: !item.completed } : item)

    try {

      if (token) setChecklist(await updateChecklist(token, next))

      else { sessionStorage.setItem('unichase.guest.dashboard-checklist', JSON.stringify(next)); setChecklist(next) }

    } catch { setProfileMessage('Could not save the checklist. Please try again.') }

  }



  const saveProfile = async () => {

    if (!token || !profile) return

    try { const user = await updateProfile(token, profile); setProfile(user); setStoredUser(user); setProfileMessage('Profile saved.') }

    catch { setProfileMessage('Could not save profile. Please try again.') }

  }



  const addApplication = () => {

    if (!token || !applicationForm.universityId) return

    createApplication(token, {

      universityId: Number(applicationForm.universityId),

      status: applicationForm.status,

      intake: applicationForm.intake || null,

      applicationDeadline: applicationForm.applicationDeadline || null,

    })

      .then((item) => {

        setApplications((current) => [item, ...current])

        setApplicationForm({ universityId: "", status: "Interested", intake: "", applicationDeadline: "" })

      })

      .catch(() => setProfileMessage("Could not add application."))

  }



  const changeApplicationStatus = (item: UserApplication, status: string) => {

    if (!token) return

    updateApplication(token, item.id, { status })

      .then((updated) => setApplications((current) => current.map((entry) => (entry.id === item.id ? updated : entry))))

      .catch(() => setProfileMessage("Could not update application."))

  }



  const addDocument = () => {

    if (!token || !documentForm.title) return

    createDocumentItem(token, documentForm)

      .then((item) => {

        setDocuments((current) => [item, ...current])

        setDocumentForm({ documentType: "Passport", title: "Passport", status: "missing" })

      })

      .catch(() => setProfileMessage("Could not add document."))

  }



  const changeDocumentStatus = (item: UserDocument, status: string) => {

    if (!token) return

    updateDocumentItem(token, item.id, { status })

      .then((updated) => setDocuments((current) => current.map((entry) => (entry.id === item.id ? updated : entry))))

      .catch(() => setProfileMessage("Could not update document."))

  }



  const logout = () => {

    clearToken()

    setTokenState(null)

    setProfile(null)

  }



  const studentTools = [

    { to: "/programs", label: "Program finder", detail: "Browse program-level pages." },

    { to: "/roadmap", label: "Application roadmap", detail: "Plan application steps." },

    { to: "/documents", label: "Document checklist", detail: "Generate required documents." },

    { to: "/essay-helper", label: "Essay helper", detail: "Review study-plan drafts." },

    { to: "/visa-guide", label: "Visa guide", detail: "Track student visa tasks." },

    { to: "/cost-calculator", label: "Cost calculator", detail: "Estimate first-year costs." },

    { to: "/eligibility", label: "Eligibility checker", detail: "Check readiness gaps." },

    { to: "/reminders", label: "Email reminders", detail: "Manage reminder preferences." },

    { to: "/faq", label: "FAQ center", detail: "Find application answers." },

  ]



  return (

    <div className="page-fade max-w-6xl mx-auto px-6 py-8">

      <div className="flex items-center justify-between gap-4 mb-6">

        <h1 className="text-2xl font-bold text-navy">Student dashboard</h1>

        {token ? (

          <button onClick={logout} className="text-sm text-muted hover:text-teal transition-colors">Logout</button>

        ) : (

          <Link to="/login" className="text-sm text-teal hover:underline">Login to sync dashboard</Link>

        )}

      </div>



      {profileMessage && <p role="status" className="bg-surface border border-teal rounded-lg p-3 mb-4 text-sm text-ink">{profileMessage}</p>}

      {loading && <p role="status" className="text-muted mb-4">Loading your workspace…</p>}

      <section className="bg-surface rounded-2xl shadow-sm p-5 mb-6">

        <h2 className="text-lg font-bold text-navy mb-3">Student Tools</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

          {studentTools.map((tool) => (

            <Link key={tool.to} to={tool.to} className="border border-gray-200 rounded-lg p-3 hover:border-teal transition-colors">

              <span className="block text-sm font-semibold text-navy">{tool.label}</span>

              <span className="block mt-1 text-xs text-muted">{tool.detail}</span>

            </Link>

          ))}

        </div>

      </section>



      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        <section className="bg-surface rounded-2xl shadow-sm p-5">

          <h2 className="text-lg font-bold text-navy mb-3">My Saved Universities</h2>

          {saved.length > 0 && <button className="text-sm text-teal mb-3" onClick={() => void exportStudentToolPdf('UniChase shortlist', saved.map(uni => ({ title: uni.name, lines: [uni.city || 'Location not verified', `QS ${uni.qsRankingYear}: ${uni.qsRanking || 'Unknown'}`, uni.officialWebsite || ''] }))).catch(() => setProfileMessage('Could not export your shortlist.'))}>Export PDF</button>}

          <div className="space-y-3">

            {saved.length === 0 && <p className="text-sm text-muted">Saved universities will appear here.</p>}

            {saved.map((uni) => (

              <Link key={uni.id} to={`/universities/${uni.slug || uni.id}`} className="flex items-center gap-3 text-sm hover:opacity-80 transition-opacity">

                <img src={uni.logo} alt={`${uni.name} logo`} className="h-8 w-8 object-contain" />

                <span className="font-medium text-navy">{uni.name}</span>

              </Link>

            ))}

          </div>

        </section>



        <section className="bg-surface rounded-2xl shadow-sm p-5">

          <h2 className="text-lg font-bold text-navy mb-3">Followed Universities</h2>

          {followed.length ? followed.map(uni => <Link key={uni.id} to={`/universities/${uni.slug || uni.id}`} className="block text-sm text-teal py-2">{uni.name}</Link>) : <p className="text-sm text-muted">Follow universities from the directory to keep them here.</p>}

        </section>

        <section className="bg-surface rounded-2xl shadow-sm p-5">

          <h2 className="text-lg font-bold text-navy mb-3">My Comparisons</h2>

          <div className="space-y-2 text-sm text-gray-700">

            {compared.length === 0 && <p className="text-muted">Choose 2 to 4 universities to compare.</p>}

            {compared.map((uni) => <p key={uni.id}>{uni.name}</p>)}

            <Link to="/compare" className="inline-block mt-2 text-teal hover:underline">Open comparison</Link>

          </div>

        </section>



        <section className="bg-surface rounded-2xl shadow-sm p-5">

          <h2 className="text-lg font-bold text-navy mb-3">My Application Checklist</h2>

          <div className="space-y-3">

            {checklist.map((item, index) => (

              <label key={`${item.title}-${index}`} className="flex items-center gap-3 text-sm text-gray-700">

                <input type="checkbox" checked={item.completed} onChange={() => toggleChecklist(index)} className="h-4 w-4 rounded border-gray-300 text-teal focus:ring-teal" />

                <span className={item.completed ? "line-through text-muted" : ""}>{item.title}</span>

              </label>

            ))}

          </div>

        </section>



        <section className="bg-surface rounded-2xl shadow-sm p-5">

          <h2 className="text-lg font-bold text-navy mb-3">My Deadlines</h2>

          <div className="space-y-3 text-sm text-gray-700">

            {deadlines.length === 0 && <p className="text-muted">Saved deadlines will appear here.</p>}

            {deadlines.map((item) => (

              <div key={`${item.university.id}-${item.deadlineType}`} className="flex items-center justify-between gap-3">

                <span>{item.university.name} · {item.deadlineType}</span>

                {item.important && <span className="text-teal font-medium">Important</span>}

              </div>

            ))}

          </div>

        </section>



        <section className="bg-surface rounded-2xl shadow-sm p-5">

          <h2 className="text-lg font-bold text-navy mb-3">My Recommendations</h2>

          <p className="text-sm text-muted">Use the match form to generate recommendations based on your major, budget, city, language, housing, and ranking preferences.</p>

          <Link to="/match" className="inline-block mt-3 text-sm text-teal hover:underline">Find my best university match</Link>

        </section>



        <section className="bg-surface rounded-2xl shadow-sm p-5">

          <h2 className="text-lg font-bold text-navy mb-3">Your preferences</h2>

          <p className="text-sm text-muted">{onboarding?.onboardingCompleted ? 'Your preferences are ready. Update them as your plans change.' : 'Set your study goals to create a starter roadmap and checklist.'}</p>

          <Link to="/onboarding" className="inline-block mt-3 text-sm text-teal underline">Edit study preferences</Link>

        </section>



        <section className="bg-surface rounded-2xl shadow-sm p-5">

          <h2 className="text-lg font-bold text-navy mb-3">My Applications</h2>

          <div className="grid gap-3">

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">

              <select aria-label="University for application" value={applicationForm.universityId} onChange={(e) => setApplicationForm({ ...applicationForm, universityId: e.target.value })} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal">

                <option value="">Choose university</option>

                {directory.map((uni) => <option key={uni.id} value={uni.id}>{uni.name}</option>)}

              </select>

              <select aria-label="Application status" value={applicationForm.status} onChange={(e) => setApplicationForm({ ...applicationForm, status: e.target.value })} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal">

                {["Interested", "Preparing Documents", "Ready to Apply", "Applied", "Waiting for Result", "Interview Scheduled", "Accepted", "Rejected", "Deferred", "Enrolled", "Withdrawn"].map((status) => <option key={status}>{status}</option>)}

              </select>

              <input value={applicationForm.intake} onChange={(e) => setApplicationForm({ ...applicationForm, intake: e.target.value })} placeholder="Intake" className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />

              <input type="date" value={applicationForm.applicationDeadline} onChange={(e) => setApplicationForm({ ...applicationForm, applicationDeadline: e.target.value })} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />

            </div>

            <button disabled={!token || loading} onClick={addApplication} className="w-fit bg-navy text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-navy-light">Add application</button>

            {applications.length === 0 && <p className="text-sm text-muted">Tracked applications will appear here.</p>}

            {applications.map((item) => (

              <div key={item.id} className="rounded-xl border border-gray-100 p-3">

                <p className="font-semibold text-navy">{item.university?.name || "University"} <span className="text-xs text-muted">- {item.intake || "No intake"}</span></p>

                <select aria-label={`${item.id} status`} value={item.status} onChange={(e) => changeApplicationStatus(item, e.target.value)} className="mt-2 bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal">

                  {["Interested", "Preparing Documents", "Ready to Apply", "Applied", "Waiting for Result", "Interview Scheduled", "Accepted", "Rejected", "Deferred", "Enrolled", "Withdrawn"].map((status) => <option key={status}>{status}</option>)}

                </select>

                {item.applicationDeadline && <p className="mt-2 text-xs text-muted">Deadline: {new Date(item.applicationDeadline).toLocaleDateString()}</p>}

                <details className="mt-3 text-sm"><summary className="cursor-pointer text-teal">Edit application details</summary>

                  <form className="grid gap-3 mt-3" onSubmit={async event => {

                    event.preventDefault(); if (!token) return

                    const values = new FormData(event.currentTarget)

                    const data = Object.fromEntries(['intake', 'applicationDeadline', 'submittedDate', 'resultDate', 'notes', 'priority'].map(key => [key, values.get(key) || null]))

                    try { const updated = await updateApplication(token, item.id, data); setApplications(current => current.map(entry => entry.id === item.id ? updated : entry)); setProfileMessage('Application saved.') }

                    catch { setProfileMessage('Could not save application details. Check the dates and try again.') }

                  }}>

                    {(['intake', 'applicationDeadline', 'submittedDate', 'resultDate'] as const).map(key => <label key={key} className="text-ink">{{ intake: 'Target intake', applicationDeadline: 'Application deadline', submittedDate: 'Submission date', resultDate: 'Result date' }[key]}<input name={key} type={key === 'intake' ? 'text' : 'date'} defaultValue={item[key]?.slice(0, key === 'intake' ? 80 : 10) || ''} className="mt-1 w-full rounded-lg border bg-cream p-2" /></label>)}

                    <label className="text-ink">Priority<select name="priority" defaultValue={item.priority} className="block mt-1 rounded-lg border bg-cream p-2">{['low', 'normal', 'high'].map(value => <option key={value}>{value}</option>)}</select></label>

                    <label className="text-ink">Notes<textarea name="notes" defaultValue={item.notes || ''} maxLength={3000} className="block w-full mt-1 rounded-lg border bg-cream p-2" /></label>

                    <button className="rounded-lg bg-teal text-white p-2">Save details</button>

                    <button type="button" className="text-red-600" onClick={() => { if (token) void deleteApplication(token, item.id).then(() => setApplications(current => current.filter(entry => entry.id !== item.id))).catch(() => setProfileMessage('Could not delete application.')) }}>Delete application</button>

                  </form>

                </details>

              </div>

            ))}

          </div>

        </section>



        <section className="bg-surface rounded-2xl shadow-sm p-5">

          <h2 className="text-lg font-bold text-navy mb-3">Document Vault</h2>

          <div className="grid gap-3">

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">

              <select aria-label="Document type" value={documentForm.documentType} onChange={(e) => setDocumentForm({ ...documentForm, documentType: e.target.value, title: e.target.value })} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal">

                {["Passport", "Transcript", "Diploma", "Recommendation Letter", "Personal Statement", "Language Certificate", "Financial Proof", "ID Photo", "Application Form", "Portfolio", "Visa Documents", "Other"].map((type) => <option key={type}>{type}</option>)}

              </select>

              <input aria-label="Document title" value={documentForm.title} onChange={(e) => setDocumentForm({ ...documentForm, title: e.target.value })} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />

              <select aria-label="Document status" value={documentForm.status} onChange={(e) => setDocumentForm({ ...documentForm, status: e.target.value })} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal">

                {["missing", "preparing", "ready", "submitted", "expired"].map((status) => <option key={status}>{status}</option>)}

              </select>

            </div>

            <button disabled={!token || loading} onClick={addDocument} className="w-fit bg-navy text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-navy-light">Add document</button>

            {documents.map((item) => (

              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 p-3">

                <div>

                  <p className="font-semibold text-navy">{item.title}</p>

                  <p className="text-xs text-muted">{item.documentType}</p>

                </div>

                <select aria-label={`${item.id} status`} value={item.status} onChange={(e) => changeDocumentStatus(item, e.target.value)} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal">

                  {["missing", "preparing", "ready", "submitted", "expired"].map((status) => <option key={status}>{status}</option>)}

                </select>

                <details className="w-full text-sm"><summary className="text-teal cursor-pointer">Edit document details</summary>

                  <form className="grid gap-3 mt-3" onSubmit={async event => {

                    event.preventDefault(); if (!token) return

                    const values = new FormData(event.currentTarget)

                    try { const updated = await updateDocumentItem(token, item.id, { expirationDate: String(values.get('expirationDate') || '') || null, notes: String(values.get('notes') || '') || null, applicationId: values.get('applicationId') ? Number(values.get('applicationId')) : null }); setDocuments(current => current.map(entry => entry.id === item.id ? updated : entry)); setProfileMessage('Document saved.') }

                    catch { setProfileMessage('Could not save document details.') }

                  }}>

                    <label className="text-ink">Expiration date<input type="date" name="expirationDate" defaultValue={item.expirationDate?.slice(0, 10) || ''} className="block w-full mt-1 bg-cream rounded-lg border p-2" /></label>

                    <label className="text-ink">Related application<select name="applicationId" defaultValue={item.applicationId || ''} className="block w-full mt-1 bg-cream rounded-lg border p-2"><option value="">None</option>{applications.map(application => <option key={application.id} value={application.id}>{application.university?.name} · {application.intake || application.status}</option>)}</select></label>

                    <label className="text-ink">Notes<textarea name="notes" defaultValue={item.notes || ''} maxLength={3000} className="block w-full mt-1 bg-cream rounded-lg border p-2" /></label>

                    <button className="rounded-lg bg-teal text-white p-2">Save details</button>

                    <button type="button" className="text-red-600" onClick={() => { if (token) void deleteDocumentItem(token, item.id).then(() => setDocuments(current => current.filter(entry => entry.id !== item.id))).catch(() => setProfileMessage('Could not delete document.')) }}>Delete document</button>

                  </form>

                </details>

              </div>

            ))}

            <p className="text-xs text-muted">Track document status, notes, and expiry here. File uploads are not available.</p>

          </div>

        </section>



        <section className="bg-surface rounded-2xl shadow-sm p-5">

          <div className="mb-3 flex items-center justify-between gap-3">

            <h2 className="text-lg font-bold text-navy">Upcoming Calendar</h2>

            <Link to="/calendar" className="text-sm text-teal hover:underline">Open calendar</Link>

          </div>

          <div className="space-y-3">

            {calendarEvents.filter(event => event.status === "upcoming" && new Date(event.startDate).getTime() >= new Date().setHours(0, 0, 0, 0)).sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate)).slice(0, 5).map((event) => (

              <div key={event.id} className="rounded-xl border border-gray-100 p-3">

                <p className="font-semibold text-navy">{event.title}</p>

                <p className="text-xs text-muted">{new Date(event.startDate).toLocaleDateString()} - {event.eventType.replaceAll("_", " ")}</p>

              </div>

            ))}

            {calendarEvents.length === 0 && <p className="text-sm text-muted">Upcoming events and connected deadlines will appear here.</p>}

          </div>

        </section>



        <section className="bg-surface rounded-2xl shadow-sm p-5">

          <h2 className="text-lg font-bold text-navy mb-3">Profile</h2>

          {profile ? (

            <div className="grid grid-cols-1 gap-3">

              <input aria-label="Full name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />

              <input value={profile.preferredMajor || ""} onChange={(e) => setProfile({ ...profile, preferredMajor: e.target.value })} placeholder="Preferred major" className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />

              <input value={profile.preferredCity || ""} onChange={(e) => setProfile({ ...profile, preferredCity: e.target.value })} placeholder="Preferred city" className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />

              <button onClick={saveProfile} className="bg-navy text-white px-5 py-2 rounded-lg font-semibold hover:bg-navy-light transition-colors">Save profile</button>

              {profileMessage && <p className="text-sm text-teal">{profileMessage}</p>}

            </div>

          ) : (

            <p className="text-sm text-muted">Login or create an account to manage profile details securely.</p>

          )}

        </section>

      </div>

    </div>
  )
}
