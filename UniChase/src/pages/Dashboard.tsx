import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import type { University } from "@/data/universities"
import {
  fetchAccountDeadlines,
  fetchChecklist,
  fetchComparedUniversities,
  fetchProfile,
  fetchSavedUniversities,
  updateChecklist,
  updateProfile,
  type StudentUser,
} from "@/lib/api"
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

    updateProfile(token, profile).then((user) => {
      setProfile(user)
      setStoredUser(user)
      setProfileMessage("Profile saved.")
    }).catch(() => setProfileMessage("Could not save profile."))
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
