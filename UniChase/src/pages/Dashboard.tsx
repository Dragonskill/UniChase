import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import type { University } from "@/data/universities"
import {
  createApplication,
  createDocumentItem,
  fetchAccountDeadlines,
  fetchApplications,
  fetchCalendarEvents,
  fetchChecklist,
  fetchComparedUniversities,
  fetchDocuments,
  fetchOnboarding,
  fetchProfile,
  fetchSavedUniversities,
  generateDashboardFromOnboarding,
  saveOnboarding,
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
import { getLocalSessionUser, isLocalAuthToken, updateLocalSessionUser } from "@/lib/authSession"
import { applySeo } from "@/lib/seo"
import {
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
  const [token, setTokenState] = useState(() => getToken())
  const [profile, setProfile] = useState<StudentUser | null>(() => getStoredUser<StudentUser>())
  const [saved, setSaved] = useState<University[]>([])
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
    const savedIds = getSavedUniversityIds()
    const compareIds = getCompareUniversityIds()

    if (savedIds.length > 0) {
      fetchComparedUniversities(savedIds.slice(0, 4)).then(setSaved).catch(() => undefined)
    }

    if (compareIds.length >= 2) {
      fetchComparedUniversities(compareIds).then(setCompared).catch(() => undefined)
    }

    if (!token) {
      return
    }

    if (isLocalAuthToken(token)) {
      Promise.resolve().then(() => {
        const localUser = getLocalSessionUser(token)

        if (localUser) {
          setProfile(localUser)
          setStoredUser(localUser)
        } else {
          clearToken()
          setTokenState(null)
          setProfile(null)
        }
      })

      return
    }

    fetchProfile(token)
      .then((user) => {
        setProfile(user)
        setStoredUser(user)
      })
      .catch(() => {
        clearToken()
        setTokenState(null)
      })

    fetchSavedUniversities(token).then((items) => {
      if (items.length > 0) {
        setSaved(items)
      }
    }).catch(() => undefined)
    fetchChecklist(token).then(setChecklist).catch(() => undefined)
    fetchAccountDeadlines(token).then(setDeadlines).catch(() => undefined)
    fetchApplications(token).then(setApplications).catch(() => undefined)
    fetchDocuments(token).then(setDocuments).catch(() => undefined)
    fetchCalendarEvents(token).then(setCalendarEvents).catch(() => undefined)
    fetchOnboarding(token).then(setOnboarding).catch(() => undefined)
  }, [token])

  useEffect(() => {
    const localDeadlines = getLocalDeadlines()

    if (localDeadlines.length === 0 || deadlines.length > 0) {
      return
    }

    fetchComparedUniversities(localDeadlines.map((item) => item.universityId).slice(0, 4))
      .then((universities) => {
        setDeadlines(
          localDeadlines
            .map((deadline) => {
              const university = universities.find((item) => item.id === deadline.universityId)
              return university ? { ...deadline, university } : null
            })
            .filter(Boolean) as { deadlineType: string; important: boolean; university: University }[],
        )
      })
      .catch(() => undefined)
  }, [deadlines.length])

  const toggleChecklist = (index: number) => {
    const next = checklist.map((item, itemIndex) =>
      itemIndex === index ? { ...item, completed: !item.completed } : item,
    )
    setChecklist(next)

    if (token) {
      updateChecklist(token, next).catch(() => undefined)
    }
  }

  const saveProfile = () => {
    if (!token || !profile) {
      return
    }

    if (isLocalAuthToken(token)) {
      const user = updateLocalSessionUser(token, profile)

      if (user) {
        setProfile(user)
        setStoredUser(user)
        setProfileMessage("Profile saved.")
      } else {
        setProfileMessage("Could not save profile.")
      }

      return
    }

    updateProfile(token, profile).then((user) => {
      setProfile(user)
      setStoredUser(user)
      setProfileMessage("Profile saved.")
    }).catch(() => setProfileMessage("Could not save profile."))
  }

  const saveOnboardingPreferences = () => {
    if (!token) return
    const payload = onboarding || {
      desiredMajor: profile?.preferredMajor || "",
      preferredCity: profile?.preferredCity || "",
      degreeLevel: profile?.preferredLevel || "",
      onboardingCompleted: false,
    }

    saveOnboarding(token, payload)
      .then((savedPreference) => {
        setOnboarding(savedPreference)
        setProfileMessage("Onboarding preferences saved.")
      })
      .catch(() => setProfileMessage("Could not save onboarding."))
  }

  const setupDashboard = () => {
    if (!token) return
    generateDashboardFromOnboarding(token)
      .then((result) => {
        if (result.recommendedUniversities.length > 0) {
          setSaved(result.recommendedUniversities.slice(0, 4))
        }
        setOnboarding((current) => ({ ...(current || {}), onboardingCompleted: true }))
        setProfileMessage("Dashboard generated from onboarding.")
      })
      .catch(() => setProfileMessage("Could not generate dashboard."))
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-surface rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-navy mb-3">My Saved Universities</h2>
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
          <h2 className="text-lg font-bold text-navy mb-3">Onboarding</h2>
          {token ? (
            <div className="grid gap-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input value={onboarding?.desiredMajor || ""} onChange={(e) => setOnboarding({ ...(onboarding || {}), desiredMajor: e.target.value })} placeholder="Desired major" className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
                <input value={onboarding?.degreeLevel || ""} onChange={(e) => setOnboarding({ ...(onboarding || {}), degreeLevel: e.target.value })} placeholder="Degree level" className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
                <input value={onboarding?.preferredCity || ""} onChange={(e) => setOnboarding({ ...(onboarding || {}), preferredCity: e.target.value })} placeholder="Preferred city" className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
                <input value={onboarding?.targetIntake || ""} onChange={(e) => setOnboarding({ ...(onboarding || {}), targetIntake: e.target.value })} placeholder="Target intake" className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={saveOnboardingPreferences} className="bg-navy text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-navy-light">Save onboarding</button>
                <button onClick={setupDashboard} className="bg-teal text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-light">Generate dashboard</button>
                <span className="self-center text-xs text-muted">{onboarding?.onboardingCompleted ? "Completed" : "Not completed"}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">Login to save onboarding preferences.</p>
          )}
        </section>

        <section className="bg-surface rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-navy mb-3">My Applications</h2>
          <div className="grid gap-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <select value={applicationForm.universityId} onChange={(e) => setApplicationForm({ ...applicationForm, universityId: e.target.value })} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal">
                <option value="">Choose university</option>
                {saved.map((uni) => <option key={uni.id} value={uni.id}>{uni.name}</option>)}
              </select>
              <select value={applicationForm.status} onChange={(e) => setApplicationForm({ ...applicationForm, status: e.target.value })} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal">
                {["Interested", "Preparing Documents", "Ready to Apply", "Applied", "Waiting for Result", "Interview Scheduled", "Accepted", "Rejected", "Deferred", "Enrolled", "Withdrawn"].map((status) => <option key={status}>{status}</option>)}
              </select>
              <input value={applicationForm.intake} onChange={(e) => setApplicationForm({ ...applicationForm, intake: e.target.value })} placeholder="Intake" className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
              <input type="date" value={applicationForm.applicationDeadline} onChange={(e) => setApplicationForm({ ...applicationForm, applicationDeadline: e.target.value })} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
            </div>
            <button onClick={addApplication} className="w-fit bg-navy text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-navy-light">Add application</button>
            {applications.length === 0 && <p className="text-sm text-muted">Tracked applications will appear here.</p>}
            {applications.map((item) => (
              <div key={item.id} className="rounded-xl border border-gray-100 p-3">
                <p className="font-semibold text-navy">{item.university?.name || "University"} <span className="text-xs text-muted">- {item.intake || "No intake"}</span></p>
                <select value={item.status} onChange={(e) => changeApplicationStatus(item, e.target.value)} className="mt-2 bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal">
                  {["Interested", "Preparing Documents", "Ready to Apply", "Applied", "Waiting for Result", "Interview Scheduled", "Accepted", "Rejected", "Deferred", "Enrolled", "Withdrawn"].map((status) => <option key={status}>{status}</option>)}
                </select>
                {item.applicationDeadline && <p className="mt-2 text-xs text-muted">Deadline: {new Date(item.applicationDeadline).toLocaleDateString()}</p>}
              </div>
            ))}
          </div>
        </section>

        <section className="bg-surface rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-navy mb-3">Document Vault</h2>
          <div className="grid gap-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <select value={documentForm.documentType} onChange={(e) => setDocumentForm({ ...documentForm, documentType: e.target.value, title: e.target.value })} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal">
                {["Passport", "Transcript", "Diploma", "Recommendation Letter", "Personal Statement", "Language Certificate", "Financial Proof", "ID Photo", "Application Form", "Portfolio", "Visa Documents", "Other"].map((type) => <option key={type}>{type}</option>)}
              </select>
              <input value={documentForm.title} onChange={(e) => setDocumentForm({ ...documentForm, title: e.target.value })} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
              <select value={documentForm.status} onChange={(e) => setDocumentForm({ ...documentForm, status: e.target.value })} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal">
                {["missing", "preparing", "ready", "submitted", "expired"].map((status) => <option key={status}>{status}</option>)}
              </select>
            </div>
            <button onClick={addDocument} className="w-fit bg-navy text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-navy-light">Add document</button>
            {documents.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-3">
                <div>
                  <p className="font-semibold text-navy">{item.title}</p>
                  <p className="text-xs text-muted">{item.documentType}</p>
                </div>
                <select value={item.status} onChange={(e) => changeDocumentStatus(item, e.target.value)} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal">
                  {["missing", "preparing", "ready", "submitted", "expired"].map((status) => <option key={status}>{status}</option>)}
                </select>
              </div>
            ))}
            <p className="text-xs text-muted">Secure file upload is prepared at the API layer, but private storage is not configured yet; this vault tracks document status safely.</p>
          </div>
        </section>

        <section className="bg-surface rounded-2xl shadow-sm p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-navy">Upcoming Calendar</h2>
            <Link to="/calendar" className="text-sm text-teal hover:underline">Open calendar</Link>
          </div>
          <div className="space-y-3">
            {calendarEvents.slice(0, 5).map((event) => (
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
              <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
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
