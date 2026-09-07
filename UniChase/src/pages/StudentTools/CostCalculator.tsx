import { useEffect, useMemo, useState } from "react"
import GlowLetters from "@/components/ui/GlowLetters"
import { createCostEstimate, deleteCostEstimate, fetchCostEstimates, fetchUniversities, type CostEstimate } from "@/lib/api"
import type { University } from "@/data/universities"
import { exportStudentToolPdf } from "@/lib/pdfExport"
import { applySeo } from "@/lib/seo"
import { getToken } from "@/lib/storage"
import { calculateLocalCost, deleteLocalCostEstimate, getLocalCostEstimates, saveLocalCostEstimate } from "@/lib/studentToolsLocal"

const defaultInput = {
  name: "First year in Korea",
  tuitionPerSemester: 4000000,
  semestersPerYear: 2,
  monthsPerSemester: 4.5,
  housingMonthly: 450000,
  rentMonthly: 0,
  foodMonthly: 350000,
  transportMonthly: 80000,
  personalMonthly: 180000,
  insuranceMonthly: 70000,
  internetMobileMonthly: 60000,
  booksPerYear: 300000,
  applicationFees: 150000,
  visaCosts: 120000,
  flightCost: 700000,
  emergencyBudget: 1000000,
  scholarshipAmount: 0,
  universityId: null as number | null,
}

const moneyFields = [
  "tuitionPerSemester",
  "housingMonthly",
  "rentMonthly",
  "foodMonthly",
  "transportMonthly",
  "personalMonthly",
  "insuranceMonthly",
  "internetMobileMonthly",
  "booksPerYear",
  "applicationFees",
  "visaCosts",
  "flightCost",
  "emergencyBudget",
  "scholarshipAmount",
] as const

const fieldLabels: Record<(typeof moneyFields)[number], string> = {
  tuitionPerSemester: "Tuition per semester",
  housingMonthly: "Dormitory / campus housing monthly",
  rentMonthly: "Off-campus rent monthly",
  foodMonthly: "Food monthly",
  transportMonthly: "Transportation monthly",
  personalMonthly: "Personal expenses monthly",
  insuranceMonthly: "Insurance monthly",
  internetMobileMonthly: "Internet and mobile monthly",
  booksPerYear: "Books per year",
  applicationFees: "Application fees",
  visaCosts: "Visa costs",
  flightCost: "Flights",
  emergencyBudget: "Emergency budget",
  scholarshipAmount: "Scholarship amount",
}

export default function CostCalculator() {
  const [form, setForm] = useState<Record<string, number | string | null>>(defaultInput)
  const [saved, setSaved] = useState<CostEstimate | null>(null)
  const [history, setHistory] = useState<CostEstimate[]>([])
  const [universities, setUniversities] = useState<University[]>([])
  const [message, setMessage] = useState("")
  const estimate = useMemo(() => calculateLocalCost(form), [form])

  useEffect(() => {
    applySeo({
      title: "Cost Calculator | UniChase",
      description: "Estimate tuition, living costs, and first-year South Korea study expenses.",
      canonicalPath: "/cost-calculator",
    })
  }, [])

  useEffect(() => {
    const token = getToken()
    Promise.resolve().then(() => token ? fetchCostEstimates(token) : getLocalCostEstimates()).then(setHistory)
      .catch(error => setMessage(error instanceof Error ? error.message : "Could not load saved estimates"))
    fetchUniversities().then(setUniversities).catch(() => setUniversities([]))
  }, [])

  const updateNumber = (field: string, value: string) => {
    setForm((current) => ({ ...current, [field]: Number(value || 0) }))
  }

  const selectUniversity = (value: string) => {
    const universityId = value ? Number(value) : null
    const university = universities.find((item) => item.id === universityId)
    const tuitionValues = [university?.tuition?.min, university?.tuition?.max].filter((item): item is number => typeof item === "number")
    setForm((current) => ({
      ...current,
      universityId,
      name: university ? `${university.name} first year` : current.name,
      tuitionPerSemester: tuitionValues.length > 0
        ? Math.round(tuitionValues.reduce((total, item) => total + item, 0) / tuitionValues.length)
        : current.tuitionPerSemester,
    }))
  }

  const saveEstimate = async () => {
    const token = getToken()

    if (token) {
      try {
        const result = await createCostEstimate(token, form)
        setSaved(result)
        setHistory(items => [result, ...items])
        setMessage("Estimate saved to your account.")
        return
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not save to your account")
        return
      }
    }

    const result = saveLocalCostEstimate(estimate)
    setSaved(result)
    setHistory(items => [result, ...items])
    setMessage("Estimate saved for this browser tab. Sign in to keep it in your account.")
  }

  const remove = async (item: CostEstimate) => {
    if (!item.id) return
    try {
      const token = getToken()
      if (token) await deleteCostEstimate(token, item.id)
      else deleteLocalCostEstimate(item.id)
      setHistory(items => items.filter(entry => entry.id !== item.id))
      if (saved?.id === item.id) setSaved(null)
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not delete estimate") }
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
            <label className="text-sm text-gray-700 md:col-span-2">
              University (verified tuition is filled automatically when available)
              <select value={form.universityId == null ? "" : String(form.universityId)} onChange={(event) => selectUniversity(event.target.value)} className="mt-1 w-full bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal">
                <option value="">General estimate</option>
                {universities.map((university) => <option key={university.id} value={university.id}>{university.name}</option>)}
              </select>
            </label>
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
                {fieldLabels[field]}
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
          {message && <p role="status" className="mt-3 text-sm text-teal">{message}</p>}
          {saved && <p className="mt-3 text-sm text-muted">Saved estimate: {saved.name}</p>}
        </section>
        {history.length > 0 && <section className="bg-surface rounded-2xl shadow-sm p-5 lg:col-span-3"><h2 className="text-lg font-bold text-navy mb-3">Saved estimates</h2><div className="grid gap-3 md:grid-cols-3">{history.map(item => <div key={item.id} className="border border-gray-200 rounded-lg p-3"><button onClick={() => setSaved(item)} className="text-left"><strong className="block text-sm text-navy">{item.name}</strong><span className="text-xs text-muted">{item.firstYearCost.toLocaleString()} KRW first year</span></button><button onClick={() => remove(item)} className="block mt-2 text-xs text-muted underline">Delete</button></div>)}</div></section>}
      </div>
    </div>
  )
}
