import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { universities as fallbackUniversities, type University } from "@/data/universities"
import UniversityImage from "@/components/ui/UniversityImage"
import { fetchComparedUniversities } from "@/lib/api"
import { exportStudentToolPdf } from "@/lib/pdfExport"
import { applySeo } from "@/lib/seo"
import { formatTuition, formatUniversityDate } from "@/lib/universityDisplay"
import { getCompareUniversityIds, setCompareUniversityIds, universityStateChangeEvent } from "@/lib/storage"

type ComparisonRow = { label: string; value: (university: University) => string; link?: boolean }
const rows: ComparisonRow[] = [
  { label: "Location", value: (university) => [university.city || university.location, university.province].filter(Boolean).join(", ") },
  { label: "QS ranking", value: (university) => university.qsRanking ? `${university.qsRanking} (${university.qsRankingYear || "year unverified"})` : "Not verified" },
  { label: "Tuition", value: formatTuition },
  { label: "Programs / majors", value: (university) => university.programs?.join(", ") || "Not verified" },
  { label: "Teaching language", value: (university) => university.languageOfInstruction?.join(", ") || "Not verified" },
  { label: "Admission requirements", value: (university) => university.admissionRequirements?.join(", ") || "Not verified" },
  { label: "Dormitory", value: (university) => university.dormitoryHousingInfo || (university.hasDormitory === true ? "Available; check the official housing guide" : university.hasDormitory === false ? "Not available" : "Not verified") },
  { label: "International support", value: (university) => university.internationalStudentInfo || "Not verified" },
  { label: "Application deadline", value: (university) => formatUniversityDate(university.deadlines?.applicationDeadline) },
  { label: "Official website", value: (university) => university.officialWebsite || "Not listed", link: true },
]

export default function Compare() {
  const [ids, setIds] = useState(getCompareUniversityIds)
  const [universities, setUniversities] = useState<University[]>([])
  const [loadedKey, setLoadedKey] = useState("")
  const requestKey = ids.join(",")
  const loading = ids.length >= 2 && loadedKey !== requestKey
  const [error, setError] = useState("")
  const [exporting, setExporting] = useState(false)

  useEffect(() => applySeo({ title: "Compare Universities | UniChase", description: "Compare Korean universities side by side by ranking, tuition, programs, deadlines, and student support.", canonicalPath: "/compare" }), [])
  useEffect(() => {
    const sync = () => setIds(getCompareUniversityIds())
    window.addEventListener("storage", sync)
    window.addEventListener(universityStateChangeEvent, sync)
    return () => { window.removeEventListener("storage", sync); window.removeEventListener(universityStateChangeEvent, sync) }
  }, [])
  useEffect(() => {
    let active = true
    if (ids.length < 2) return () => { active = false }
    fetchComparedUniversities(ids).then((items) => {
      if (active) { setError(""); setUniversities(ids.flatMap((id) => { const item = items.find((university) => university.id === id); return item ? [item] : [] })) }
    }).catch(() => {
      if (!active) return
      setUniversities(ids.flatMap((id) => { const item = fallbackUniversities.find((university) => university.id === id); return item ? [item] : [] }))
      setError("Showing saved directory data. Live university updates are temporarily unavailable.")
    }).finally(() => { if (active) setLoadedKey(requestKey) })
    return () => { active = false }
  }, [ids, requestKey])

  const remove = (id: number) => { const next = ids.filter((item) => item !== id); setCompareUniversityIds(next); setIds(next) }
  const sections = useMemo(() => universities.map((university) => ({ title: university.name, lines: rows.map((row) => `${row.label}: ${row.value(university)}`) })), [universities])
  const exportPdf = async () => { setExporting(true); try { await exportStudentToolPdf("UniChase university comparison", sections) } catch { setError("Could not export PDF. Please allow pop-ups and retry.") } finally { setExporting(false) } }

  if (ids.length < 2) return <div className="page-fade max-w-6xl mx-auto px-5 sm:px-6 py-8"><div className="bg-surface rounded-2xl shadow-sm p-6"><h1 className="text-2xl font-bold text-navy">Compare universities</h1><p className="text-muted mt-2">Select 2 to 4 universities from the directory to compare them here. Your selection stays on this device.</p><Link to="/university" className="inline-block mt-4 text-sm font-semibold text-teal hover:underline">Choose universities</Link></div></div>

  return <div className="page-fade max-w-6xl mx-auto px-4 sm:px-6 py-8">
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6"><div><h1 className="text-2xl font-bold text-navy">Compare universities</h1><p className="mt-1 text-sm text-muted">{ids.length} of 4 selected</p></div><div className="flex gap-3"><button type="button" onClick={exportPdf} disabled={loading || !universities.length || exporting} className="rounded-full border border-gray-200 px-4 py-2 text-sm text-muted disabled:opacity-50">{exporting ? "Preparing PDF…" : "Export PDF"}</button><Link to="/university" className="rounded-full bg-navy px-4 py-2 text-sm text-white">Add more</Link></div></div>
    {error && <p role="status" className="mb-4 rounded-xl border border-gray-200 bg-surface px-4 py-3 text-sm text-muted">{error}</p>}
    {loading ? <div role="status" className="rounded-2xl bg-surface p-8 text-center text-muted">Loading comparison…</div> : universities.length < 2 ? <div role="alert" className="rounded-2xl bg-surface p-8"><p className="text-muted">Some selected universities could not be loaded.</p><button type="button" onClick={() => { setCompareUniversityIds([]); setIds([]) }} className="mt-3 text-teal">Clear selection</button></div> : <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-surface shadow-sm" tabIndex={0} aria-label="Scrollable university comparison table"><table className="w-full min-w-[760px] table-fixed text-left text-sm"><caption className="sr-only">Side-by-side university comparison</caption><thead><tr className="border-b border-gray-100"><th className="sticky left-0 z-10 w-40 bg-surface p-4 text-navy">Field</th>{universities.map((university) => <th key={university.id} scope="col" className="p-4 text-navy"><div className="flex items-start gap-3"><UniversityImage src={university.logo} alt={`${university.name} logo`} fallbackLabel={university.name} color={university.mainColor} kind="logo" className="h-10 w-10 shrink-0 object-contain" /><Link to={`/universities/${university.slug || university.id}`} className="line-clamp-2 hover:text-teal">{university.name}</Link></div></th>)}</tr></thead><tbody className="divide-y divide-gray-100">{rows.map((row) => <tr key={row.label}><th scope="row" className="sticky left-0 z-10 bg-surface p-4 align-top font-medium text-navy">{row.label}</th>{universities.map((university) => <td key={university.id} className="p-4 align-top text-gray-700">{row.link && university.officialWebsite ? <a href={university.officialWebsite} target="_blank" rel="noreferrer" className="text-teal hover:underline">Open official site</a> : row.value(university)}</td>)}</tr>)}<tr><th scope="row" className="sticky left-0 z-10 bg-surface p-4 text-navy">Actions</th>{universities.map((university) => <td key={university.id} className="p-4"><button type="button" onClick={() => remove(university.id)} className="text-sm text-muted hover:text-teal" aria-label={`Remove ${university.name} from comparison`}>Remove</button></td>)}</tr></tbody></table></div>}
  </div>
}
