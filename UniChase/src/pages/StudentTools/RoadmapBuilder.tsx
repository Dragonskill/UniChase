import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import GlowLetters from "@/components/ui/GlowLetters"
import {
  createRoadmap,
  fetchRoadmaps,
  updateRoadmapStep,
  type ApplicationRoadmap,
} from "@/lib/api"
import { getToken } from "@/lib/storage"
import { isLocalAuthToken } from "@/lib/authSession"
import { exportStudentToolPdf } from "@/lib/pdfExport"
import { applySeo } from "@/lib/seo"
import { createLocalRoadmap, getLocalRoadmaps, updateLocalRoadmapStep } from "@/lib/studentToolsLocal"

const defaultForm = {
  targetMajor: "Computer Science",
  degreeLevel: "undergraduate",
  intake: "Fall 2026",
  preparationStatus: "Starting research",
  deadlinePreference: "Standard",
  universityId: null as number | null,
}

export default function RoadmapBuilder() {
  const [form, setForm] = useState(defaultForm)
  const [roadmaps, setRoadmaps] = useState<ApplicationRoadmap[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")

  useEffect(() => {
    applySeo({
      title: "Application Roadmap Builder | UniChase",
      description: "Create a step-by-step South Korea university application roadmap.",
      canonicalPath: "/roadmap",
    })
  }, [])

  useEffect(() => {
    const token = getToken()

    if (!token || isLocalAuthToken(token)) {
      Promise.resolve().then(() => {
        setRoadmaps(getLocalRoadmaps())
        setLoading(false)
      })
      return
    }

    fetchRoadmaps(token)
      .then(setRoadmaps)
      .catch(() => setRoadmaps(getLocalRoadmaps()))
      .finally(() => setLoading(false))
  }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const token = getToken()

    if (token && !isLocalAuthToken(token)) {
      try {
        const roadmap = await createRoadmap(token, form)
        setRoadmaps((items) => [roadmap, ...items])
        setMessage("Roadmap created and synced.")
        return
      } catch {
        setMessage("Backend unavailable, saved locally.")
      }
    }

    const roadmap = createLocalRoadmap(form)
    setRoadmaps((items) => [roadmap, ...items])
  }

  const toggleStep = async (roadmap: ApplicationRoadmap, stepId: number | undefined, completed: boolean) => {
    if (!stepId || !roadmap.id) return
    const token = getToken()

    if (token && !isLocalAuthToken(token)) {
      try {
        const updated = await updateRoadmapStep(token, stepId, { completed })
        setRoadmaps((items) => items.map((item) => (item.id === updated.id ? updated : item)))
        return
      } catch {
        setMessage("Could not sync step, saved locally when possible.")
      }
    }

    const updated = updateLocalRoadmapStep(roadmap.id, stepId, completed)
    if (updated) {
      setRoadmaps((items) => items.map((item) => (item.id === roadmap.id ? updated : item)))
    }
  }

  const exportRoadmap = (roadmap: ApplicationRoadmap) => {
    exportStudentToolPdf(`${roadmap.targetMajor} application roadmap`, [
      {
        title: "Plan",
        lines: [
          `Degree level: ${roadmap.degreeLevel}`,
          `Intake: ${roadmap.intake}`,
          `Preparation status: ${roadmap.preparationStatus}`,
          `Progress: ${roadmap.progress}%`,
        ],
      },
      {
        title: "Steps",
        lines: roadmap.steps.map((step) => `${step.completed ? "[x]" : "[ ]"} ${step.title}${step.dueDate ? ` - ${step.dueDate}` : ""}`),
      },
    ])
  }

  return (
    <div className="page-fade max-w-6xl mx-auto px-6 py-8">
      <div className="mb-6">
        <p className="text-sm text-teal font-semibold">Student tools</p>
        <h1 className="text-3xl font-bold text-navy">
          <GlowLetters text="Application roadmap" />
        </h1>
      </div>

      <section className="bg-surface rounded-2xl shadow-sm p-5 mb-6">
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input value={form.targetMajor} onChange={(e) => setForm({ ...form, targetMajor: e.target.value })} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
          <select value={form.degreeLevel} onChange={(e) => setForm({ ...form, degreeLevel: e.target.value })} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal">
            <option value="undergraduate">Undergraduate</option>
            <option value="graduate">Graduate</option>
            <option value="master">Master</option>
          </select>
          <input value={form.intake} onChange={(e) => setForm({ ...form, intake: e.target.value })} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
          <input value={form.preparationStatus} onChange={(e) => setForm({ ...form, preparationStatus: e.target.value })} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal md:col-span-2" />
          <button className="bg-navy text-white px-5 py-2 rounded-lg font-semibold hover:bg-navy-light transition-colors">Create roadmap</button>
        </form>
        {message && <p className="mt-3 text-sm text-teal">{message}</p>}
      </section>

      {loading ? (
        <div className="bg-surface rounded-2xl shadow-sm p-5 text-sm text-muted">Loading roadmap...</div>
      ) : (
        <div className="space-y-5">
          {roadmaps.length === 0 && <p className="text-sm text-muted">Create your first roadmap to begin.</p>}
          {roadmaps.map((roadmap) => (
            <section key={roadmap.id || roadmap.targetMajor} className="bg-surface rounded-2xl shadow-sm p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-navy">{roadmap.targetMajor}</h2>
                  <p className="text-sm text-muted">{roadmap.degreeLevel} · {roadmap.intake} · {roadmap.progress}% complete</p>
                </div>
                <button onClick={() => exportRoadmap(roadmap)} className="text-sm border border-gray-200 rounded-lg px-4 py-2 text-navy hover:border-teal transition-colors">Export PDF</button>
              </div>
              <div className="mt-4 space-y-3">
                {roadmap.steps.map((step) => (
                  <label key={step.id || step.title} className="flex items-start gap-3 text-sm text-gray-700">
                    <input type="checkbox" checked={step.completed} onChange={(e) => toggleStep(roadmap, step.id, e.target.checked)} className="mt-1 h-4 w-4 rounded border-gray-300 text-teal focus:ring-teal" />
                    <span>
                      <span className={step.completed ? "line-through text-muted" : "font-medium text-navy"}>{step.title}</span>
                      {step.description && <span className="block text-muted">{step.description}</span>}
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
