import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import GlowLetters from "@/components/ui/GlowLetters"
import {
  createDocumentChecklist,
  fetchDocumentChecklists,
  updateDocumentChecklistItem,
  type DocumentChecklist,
} from "@/lib/api"
import { isLocalAuthToken } from "@/lib/authSession"
import { exportStudentToolPdf } from "@/lib/pdfExport"
import { applySeo } from "@/lib/seo"
import { getToken } from "@/lib/storage"
import {
  createLocalDocumentChecklist,
  getLocalDocumentChecklists,
  updateLocalDocumentItem,
} from "@/lib/studentToolsLocal"

const defaultForm = {
  targetMajor: "Business",
  degreeLevel: "undergraduate",
  nationality: "",
  languageTrack: "English",
  universityId: null as number | null,
}

export default function DocumentChecklistPage() {
  const [form, setForm] = useState(defaultForm)
  const [checklists, setChecklists] = useState<DocumentChecklist[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")

  useEffect(() => {
    applySeo({
      title: "Document Checklist Generator | UniChase",
      description: "Generate a university application document checklist for South Korea.",
      canonicalPath: "/documents",
    })
  }, [])

  useEffect(() => {
    const token = getToken()

    if (!token || isLocalAuthToken(token)) {
      Promise.resolve().then(() => {
        setChecklists(getLocalDocumentChecklists())
        setLoading(false)
      })
      return
    }

    fetchDocumentChecklists(token)
      .then(setChecklists)
      .catch(() => setChecklists(getLocalDocumentChecklists()))
      .finally(() => setLoading(false))
  }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const token = getToken()

    if (token && !isLocalAuthToken(token)) {
      try {
        const checklist = await createDocumentChecklist(token, form)
        setChecklists((items) => [checklist, ...items])
        setMessage("Checklist created and synced.")
        return
      } catch {
        setMessage("Backend unavailable, saved locally.")
      }
    }

    const checklist = createLocalDocumentChecklist(form)
    setChecklists((items) => [checklist, ...items])
  }

  const toggleItem = async (checklist: DocumentChecklist, itemId: number | undefined, completed: boolean) => {
    if (!itemId || !checklist.id) return
    const token = getToken()

    if (token && !isLocalAuthToken(token)) {
      try {
        const updated = await updateDocumentChecklistItem(token, itemId, { completed })
        setChecklists((items) => items.map((item) => (item.id === updated.id ? updated : item)))
        return
      } catch {
        setMessage("Could not sync item, saved locally when possible.")
      }
    }

    const updated = updateLocalDocumentItem(checklist.id, itemId, completed)
    if (updated) {
      setChecklists((items) => items.map((item) => (item.id === checklist.id ? updated : item)))
    }
  }

  const exportChecklist = (checklist: DocumentChecklist) => {
    exportStudentToolPdf(`${checklist.degreeLevel} document checklist`, [
      {
        title: "Checklist",
        lines: [
          `Target major: ${checklist.targetMajor || "Not specified"}`,
          `Language track: ${checklist.languageTrack}`,
          `Progress: ${checklist.progress}%`,
        ],
      },
      {
        title: "Documents",
        lines: checklist.items.map((item) => `${item.completed ? "[x]" : "[ ]"} ${item.title}${item.optional ? " (optional)" : ""}`),
      },
    ])
  }

  return (
    <div className="page-fade max-w-6xl mx-auto px-6 py-8">
      <div className="mb-6">
        <p className="text-sm text-teal font-semibold">Student tools</p>
        <h1 className="text-3xl font-bold text-navy">
          <GlowLetters text="Document checklist" />
        </h1>
      </div>

      <section className="bg-surface rounded-2xl shadow-sm p-5 mb-6">
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input value={form.targetMajor} onChange={(e) => setForm({ ...form, targetMajor: e.target.value })} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
          <select value={form.degreeLevel} onChange={(e) => setForm({ ...form, degreeLevel: e.target.value })} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal">
            <option value="undergraduate">Undergraduate</option>
            <option value="graduate">Graduate</option>
          </select>
          <input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} placeholder="Nationality" className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
          <select value={form.languageTrack} onChange={(e) => setForm({ ...form, languageTrack: e.target.value })} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal">
            <option value="English">English</option>
            <option value="Korean">Korean</option>
          </select>
          <button className="bg-navy text-white px-5 py-2 rounded-lg font-semibold hover:bg-navy-light transition-colors">Generate</button>
        </form>
        {message && <p className="mt-3 text-sm text-teal">{message}</p>}
      </section>

      {loading ? (
        <div className="bg-surface rounded-2xl shadow-sm p-5 text-sm text-muted">Loading checklist...</div>
      ) : (
        <div className="space-y-5">
          {checklists.length === 0 && <p className="text-sm text-muted">Generate a checklist to track documents.</p>}
          {checklists.map((checklist) => (
            <section key={checklist.id || checklist.degreeLevel} className="bg-surface rounded-2xl shadow-sm p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-navy">{checklist.targetMajor || checklist.degreeLevel}</h2>
                  <p className="text-sm text-muted">{checklist.languageTrack} track · {checklist.progress}% complete</p>
                </div>
                <button onClick={() => exportChecklist(checklist)} className="text-sm border border-gray-200 rounded-lg px-4 py-2 text-navy hover:border-teal transition-colors">Export PDF</button>
              </div>
              <div className="mt-4 space-y-3">
                {checklist.items.map((item) => (
                  <label key={item.id || item.title} className="flex items-start gap-3 text-sm text-gray-700">
                    <input type="checkbox" checked={item.completed} onChange={(e) => toggleItem(checklist, item.id, e.target.checked)} className="mt-1 h-4 w-4 rounded border-gray-300 text-teal focus:ring-teal" />
                    <span>
                      <span className={item.completed ? "line-through text-muted" : "font-medium text-navy"}>{item.title}</span>
                      {item.description && <span className="block text-muted">{item.description}</span>}
                    </span>
                  </label>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
