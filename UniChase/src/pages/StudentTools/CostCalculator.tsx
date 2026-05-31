import { useEffect, useMemo, useState } from "react"
import GlowLetters from "@/components/ui/GlowLetters"
import { createCostEstimate, type CostEstimate } from "@/lib/api"
import { isLocalAuthToken } from "@/lib/authSession"
import { exportStudentToolPdf } from "@/lib/pdfExport"
import { applySeo } from "@/lib/seo"
import { getToken } from "@/lib/storage"
import { calculateLocalCost, saveLocalCostEstimate } from "@/lib/studentToolsLocal"

const defaultInput = {
  name: "First year in Korea",
  tuitionPerSemester: 4000000,
  semestersPerYear: 2,
  monthsPerSemester: 4.5,
  housingMonthly: 450000,
  foodMonthly: 350000,
  transportMonthly: 80000,
  personalMonthly: 180000,
  insuranceMonthly: 70000,
  applicationFees: 150000,
  flightCost: 700000,
  scholarshipAmount: 0,
  universityId: null as number | null,
}

const moneyFields = [
  "tuitionPerSemester",
  "housingMonthly",
  "foodMonthly",
  "transportMonthly",
  "personalMonthly",
  "insuranceMonthly",
  "applicationFees",
  "flightCost",
  "scholarshipAmount",
] as const

export default function CostCalculator() {
  const [form, setForm] = useState<Record<string, number | string | null>>(defaultInput)
  const [saved, setSaved] = useState<CostEstimate | null>(null)
  const [message, setMessage] = useState("")
  const estimate = useMemo(() => calculateLocalCost(form), [form])

  useEffect(() => {
    applySeo({
      title: "Cost Calculator | UniChase",
      description: "Estimate tuition, living costs, and first-year South Korea study expenses.",
      canonicalPath: "/cost-calculator",
    })
  }, [])

  const updateNumber = (field: string, value: string) => {
    setForm((current) => ({ ...current, [field]: Number(value || 0) }))
  }

  const saveEstimate = async () => {
    const token = getToken()

    if (token && !isLocalAuthToken(token)) {
      try {
        const result = await createCostEstimate(token, form)
        setSaved(result)
        setMessage("Estimate saved to your account.")
        return
      } catch {
        setMessage("Backend unavailable, saved locally.")
      }
    }

    setSaved(saveLocalCostEstimate(estimate))
  }

  const exportCost = () => {
    exportStudentToolPdf(String(form.name || "Study cost estimate"), [
      {
        title: "Summary",
        lines: [
          `Monthly cost: ${estimate.monthlyCost.toLocaleString()} KRW`,
          `Semester cost: ${estimate.semesterCost.toLocaleString()} KRW`,
          `Yearly cost: ${estimate.yearlyCost.toLocaleString()} KRW`,
          `First-year cost: ${estimate.firstYearCost.toLocaleString()} KRW`,
        ],
      },
      {
        title: "Breakdown",
        lines: Object.entries(estimate.breakdown).map(([key, value]) => `${key}: ${value.toLocaleString()} KRW`),
      },
    ])
  }

  return (
    <div className="page-fade max-w-6xl mx-auto px-6 py-8">
      <div className="mb-6">
        <p className="text-sm text-teal font-semibold">Student tools</p>
        <h1 className="text-3xl font-bold text-navy">
          <GlowLetters text="Cost calculator" />
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="bg-surface rounded-2xl shadow-sm p-5 lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm text-gray-700">
              Estimate name
              <input value={String(form.name || "")} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
            </label>
            <label className="text-sm text-gray-700">
              Semesters per year
              <input type="number" value={Number(form.semestersPerYear || 0)} onChange={(e) => updateNumber("semestersPerYear", e.target.value)} className="mt-1 w-full bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
            </label>
            {moneyFields.map((field) => (
              <label key={field} className="text-sm text-gray-700">
                {field.replace(/([A-Z])/g, " $1")}
                <input type="number" value={Number(form[field] || 0)} onChange={(e) => updateNumber(field, e.target.value)} className="mt-1 w-full bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
              </label>
            ))}
          </div>
        </section>

        <section className="bg-surface rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-navy mb-3">Estimate</h2>
          <div className="space-y-3 text-sm text-gray-700">
            <p>Monthly: <strong>{estimate.monthlyCost.toLocaleString()} KRW</strong></p>
            <p>Semester: <strong>{estimate.semesterCost.toLocaleString()} KRW</strong></p>
            <p>Yearly: <strong>{estimate.yearlyCost.toLocaleString()} KRW</strong></p>
            <p>First year: <strong>{estimate.firstYearCost.toLocaleString()} KRW</strong></p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={saveEstimate} className="bg-navy text-white px-5 py-2 rounded-lg font-semibold hover:bg-navy-light transition-colors">Save</button>
            <button onClick={exportCost} className="border border-gray-200 px-5 py-2 rounded-lg text-navy hover:border-teal transition-colors">Export PDF</button>
          </div>
          {message && <p className="mt-3 text-sm text-teal">{message}</p>}
          {saved && <p className="mt-3 text-sm text-muted">Saved estimate: {saved.name}</p>}
        </section>
      </div>
    </div>
  )
}

