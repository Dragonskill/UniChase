import { useEffect, useState } from "react"
import GlowLetters from "@/components/ui/GlowLetters"
import { createEligibilityCheck, type EligibilityResult } from "@/lib/api"
import { isLocalAuthToken } from "@/lib/authSession"
import { exportStudentToolPdf } from "@/lib/pdfExport"
import { applySeo } from "@/lib/seo"
import { getToken } from "@/lib/storage"
import { evaluateLocalEligibility } from "@/lib/studentToolsLocal"

const defaultForm: Record<string, unknown> = {
  targetProgram: "Computer Science",
  degreeLevel: "undergraduate",
  educationLevel: "High school graduate",
  gpa: 3.4,
  englishScore: "",
  koreanScore: "",
  budget: 12000000,
  nationality: "",
  preferredLanguage: "English",
  hasTranscript: true,
  hasPassport: true,
  hasStudyPlan: false,
  hasRecommendation: false,
  universityId: null,
}

export default function EligibilityChecker() {
  const [form, setForm] = useState(defaultForm)
  const [result, setResult] = useState<EligibilityResult | null>(null)
  const [message, setMessage] = useState("")

  useEffect(() => {
    applySeo({
      title: "Eligibility Checker | UniChase",
      description: "Check readiness for South Korea university applications.",
      canonicalPath: "/eligibility",
    })
  }, [])

  const check = async () => {
    const token = getToken()

    if (token && !isLocalAuthToken(token)) {
      try {
        const synced = await createEligibilityCheck(token, form)
        setResult(synced)
        setMessage("Eligibility result saved.")
        return
      } catch {
        setMessage("Backend unavailable, using local result.")
      }
    }

    setResult(evaluateLocalEligibility(form))
  }

  const update = (field: string, value: unknown) => setForm((current) => ({ ...current, [field]: value }))

  const exportResult = () => {
    if (!result) return
    exportStudentToolPdf(`${result.targetProgram} eligibility result`, [
      { title: "Score", lines: [`Status: ${result.status}`, `Score: ${result.score}/100`] },
      { title: "Missing requirements", lines: result.missingRequirements.length ? result.missingRequirements : ["No major gaps detected."] },
      { title: "Next steps", lines: result.nextSteps },
    ])
  }

  return (
    <div className="page-fade max-w-6xl mx-auto px-6 py-8">
      <div className="mb-6">
        <p className="text-sm text-teal font-semibold">Student tools</p>
        <h1 className="text-3xl font-bold text-navy">
          <GlowLetters text="Eligibility checker" />
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="bg-surface rounded-2xl shadow-sm p-5 lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={String(form.targetProgram || "")} onChange={(e) => update("targetProgram", e.target.value)} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
            <select value={String(form.degreeLevel || "")} onChange={(e) => update("degreeLevel", e.target.value)} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal">
              <option value="undergraduate">Undergraduate</option>
              <option value="graduate">Graduate</option>
              <option value="master">Master</option>
            </select>
            <input value={String(form.educationLevel || "")} onChange={(e) => update("educationLevel", e.target.value)} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
            <input type="number" step="0.1" value={Number(form.gpa || 0)} onChange={(e) => update("gpa", Number(e.target.value))} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
            <input value={String(form.englishScore || "")} onChange={(e) => update("englishScore", e.target.value)} placeholder="English score" className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
            <input value={String(form.koreanScore || "")} onChange={(e) => update("koreanScore", e.target.value)} placeholder="TOPIK score" className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
            <input type="number" value={Number(form.budget || 0)} onChange={(e) => update("budget", Number(e.target.value))} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
            <input value={String(form.nationality || "")} onChange={(e) => update("nationality", e.target.value)} placeholder="Nationality" className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {["hasTranscript", "hasPassport", "hasStudyPlan", "hasRecommendation"].map((field) => (
              <label key={field} className="flex items-center gap-3 text-sm text-gray-700">
                <input type="checkbox" checked={Boolean(form[field])} onChange={(e) => update(field, e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-teal focus:ring-teal" />
                {field.replace("has", "Has ")}
              </label>
            ))}
          </div>
          <button onClick={check} className="mt-4 bg-navy text-white px-5 py-2 rounded-lg font-semibold hover:bg-navy-light transition-colors">Check eligibility</button>
          {message && <p className="mt-3 text-sm text-teal">{message}</p>}
        </section>

        <section className="bg-surface rounded-2xl shadow-sm p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-bold text-navy mb-3">Result</h2>
            {result && <button onClick={exportResult} className="text-sm border border-gray-200 rounded-lg px-4 py-2 text-navy hover:border-teal transition-colors">PDF</button>}
          </div>
          {result ? (
            <div className="space-y-4 text-sm text-gray-700">
              <p>Status: <strong>{result.status}</strong></p>
              <p>Score: <strong>{result.score}/100</strong></p>
              <div>
                <h3 className="font-semibold text-navy mb-2">Missing requirements</h3>
                <ul className="space-y-2">
                  {(result.missingRequirements.length ? result.missingRequirements : ["No major gaps detected."]).map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-navy mb-2">Next steps</h3>
                <ul className="space-y-2">
                  {result.nextSteps.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">Complete the fields and run a check.</p>
          )}
        </section>
      </div>
    </div>
  )
}

