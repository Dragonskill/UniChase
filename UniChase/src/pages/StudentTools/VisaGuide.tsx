import { useEffect, useState } from "react"
import GlowLetters from "@/components/ui/GlowLetters"
import { visaGuideSteps } from "@/data/studentGuides"
import { fetchVisaChecklist, updateVisaChecklistItem, type RoadmapStep } from "@/lib/api"
import { exportStudentToolPdf } from "@/lib/pdfExport"
import { applySeo } from "@/lib/seo"
import { getToken } from "@/lib/storage"
import { getLocalVisaItems, saveLocalVisaItems } from "@/lib/studentToolsLocal"

export default function VisaGuide() {
  const [items, setItems] = useState<RoadmapStep[]>([])
  const [message, setMessage] = useState("")

  useEffect(() => {
    applySeo({
      title: "South Korea Student Visa Guide | UniChase",
      description: "Track South Korea D-2 and student visa preparation steps.",
      canonicalPath: "/visa-guide",
    })
  }, [])

  useEffect(() => {
    const token = getToken()

    if (!token) {
      Promise.resolve().then(() => setItems(getLocalVisaItems()))
      return
    }

    fetchVisaChecklist(token)
      .then(setItems)
      .catch((error) => setMessage(error instanceof Error ? error.message : "Could not load your checklist"))
  }, [])

  const toggle = async (item: RoadmapStep, completed: boolean) => {
    const next = items.map((entry) => (entry.id === item.id ? { ...entry, completed } : entry))
    const token = getToken()

    if (token && item.id) {
      try {
        await updateVisaChecklistItem(token, item.id, { completed })
        setItems(next)
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not save your checklist")
      }
      return
    }
    if (!token) { saveLocalVisaItems(next); setItems(next) }
  }

  const exportVisa = () => {
    exportStudentToolPdf("South Korea student visa checklist", [
      { title: "Guide", lines: visaGuideSteps.map((step) => `${step.title}: ${step.detail}`) },
      { title: "Checklist", lines: items.map((item) => `${item.completed ? "[x]" : "[ ]"} ${item.title}`) },
    ])
  }

  return (
    <div className="page-fade max-w-6xl mx-auto px-6 py-8">
      <div className="mb-6">
        <p className="text-sm text-teal font-semibold">Student tools</p>
        <h1 className="text-3xl font-bold text-navy">
          <GlowLetters text="Student visa guide" />
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-surface rounded-2xl shadow-sm p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-bold text-navy mb-3">Visa steps</h2>
            <button onClick={exportVisa} className="text-sm border border-gray-200 rounded-lg px-4 py-2 text-navy hover:border-teal transition-colors">Export PDF</button>
          </div>
          <div className="space-y-4">
            {visaGuideSteps.map((step) => (
              <div key={step.title}>
                <h3 className="font-semibold text-navy">{step.title}</h3>
                <p className="mt-1 text-sm text-gray-700">{step.detail}</p>
                <a className="mt-1 inline-block text-sm text-teal underline" href={step.sourceUrl} target="_blank" rel="noreferrer">{step.sourceLabel}</a>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-surface rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-navy mb-3">My visa checklist</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <label key={item.id || item.title} className="flex items-start gap-3 text-sm text-gray-700">
                <input type="checkbox" checked={item.completed} onChange={(e) => toggle(item, e.target.checked)} className="mt-1 h-4 w-4 rounded border-gray-300 text-teal focus:ring-teal" />
                <span>
                  <span className={item.completed ? "line-through text-muted" : "font-medium text-navy"}>{item.title}</span>
                  {item.description && <span className="block text-muted">{item.description}</span>}
                </span>
              </label>
            ))}
          </div>
          {message && <p role="status" className="mt-3 text-sm text-teal">{message}</p>}
        </section>
      </div>
    </div>
  )
}
