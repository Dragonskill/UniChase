import { useEffect, useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { universities } from "@/data/universities"
import UniversityImage from "@/components/ui/UniversityImage"
import { fetchRecommendations, type Recommendation, type RecommendationInput } from "@/lib/api"
import { applySeo } from "@/lib/seo"

const initialForm = { preferredMajor: "", tuitionMax: "", preferredCity: "", englishRequired: false, dormitoryRequired: false, rankingMax: "", level: "", scholarshipPreferred: false }

function localRecommendations(input: RecommendationInput): Recommendation[] {
  return universities.map((university) => {
    const checks: { match: boolean; known: boolean; good: string; bad: string }[] = []
    const programs = university.programs?.map((item) => item.toLowerCase())
    if (input.preferredMajor) checks.push({ known: Boolean(programs?.length), match: Boolean(programs?.some((item) => item.includes(input.preferredMajor!.toLowerCase()))), good: `${input.preferredMajor} appears in verified program data`, bad: programs?.length ? `${input.preferredMajor} was not found in listed programs` : "Program data needs verification" })
    if (input.preferredCity) checks.push({ known: Boolean(university.city || university.location), match: (university.city || university.location).toLowerCase().includes(input.preferredCity.toLowerCase()), good: `Located in ${university.city || university.location}`, bad: `Located in ${university.city || university.location}` })
    if (input.tuitionMax != null) checks.push({ known: university.tuition?.min != null, match: (university.tuition?.min ?? Infinity) <= input.tuitionMax, good: "Published tuition can fit your budget", bad: university.tuition?.min == null ? "Tuition data needs verification" : "Published tuition starts above your budget" })
    if (input.rankingMax != null) checks.push({ known: university.qsRankingNumber != null, match: (university.qsRankingNumber ?? Infinity) <= input.rankingMax, good: "Within your preferred QS range", bad: university.qsRankingNumber == null ? "Ranking data needs verification" : "Outside your preferred QS range" })
    if (input.englishRequired) checks.push({ known: Boolean(university.languageOfInstruction?.length), match: Boolean(university.languageOfInstruction?.includes("English")), good: "Verified English-taught availability", bad: university.languageOfInstruction?.length ? "English-taught availability is not listed" : "Teaching language needs verification" })
    if (input.dormitoryRequired) checks.push({ known: university.hasDormitory != null, match: university.hasDormitory === true, good: "Dormitory availability is listed", bad: university.hasDormitory == null ? "Dormitory data needs verification" : "Dormitory is not listed as available" })
    if (input.level) checks.push({ known: Boolean(university.studyLevels?.length), match: Boolean(university.studyLevels?.some((level) => level.toLowerCase().includes(input.level!.toLowerCase()))), good: `${input.level} study is listed`, bad: university.studyLevels?.length ? `${input.level} study is not listed` : "Degree-level data needs verification" })
    if (input.scholarshipPreferred) checks.push({ known: university.hasScholarships != null, match: university.hasScholarships === true, good: "Scholarship availability is listed", bad: university.hasScholarships == null ? "Scholarship data needs verification" : "Scholarships are not listed as available" })
    const reasons = checks.filter((check) => check.match).map((check) => check.good)
    const disadvantages = checks.filter((check) => !check.match).map((check) => check.bad)
    return { university, score: Math.round((checks.filter((check) => check.match).length / Math.max(1, checks.length)) * 100), reasons, disadvantages }
  }).sort((a, b) => b.score - a.score || (a.university.qsRankingNumber ?? Infinity) - (b.university.qsRankingNumber ?? Infinity)).slice(0, 8)
}

export default function Match() {
  const [form, setForm] = useState(initialForm)
  const [results, setResults] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => applySeo({ title: "Find My Best University Match | UniChase", description: "Get explainable Korean university recommendations by major, budget, city, language, dormitory, ranking, and degree preference.", canonicalPath: "/match" }), [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const input: RecommendationInput = { preferredMajor: form.preferredMajor.trim() || undefined, tuitionMax: form.tuitionMax ? Number(form.tuitionMax) : undefined, preferredCity: form.preferredCity.trim() || undefined, englishRequired: form.englishRequired || undefined, dormitoryRequired: form.dormitoryRequired || undefined, rankingMax: form.rankingMax ? Number(form.rankingMax) : undefined, level: form.level || undefined, scholarshipPreferred: form.scholarshipPreferred || undefined }
    if (!Object.values(input).some((value) => value !== undefined && value !== false && value !== "")) { setMessage("Choose at least one preference to get meaningful matches."); return }
    setLoading(true); setSubmitted(true); setMessage("")
    try { setResults(await fetchRecommendations(input)) }
    catch { setResults(localRecommendations(input)); setMessage("Showing an offline estimate from saved, verified fields. Live matching is temporarily unavailable.") }
    finally { setLoading(false) }
  }

  return <div className="page-fade max-w-6xl mx-auto px-5 sm:px-6 py-8">
    <div className="mb-6 max-w-3xl"><h1 className="text-2xl sm:text-3xl font-bold text-navy">Find My Best University Match</h1><p className="mt-2 text-sm text-muted">Set the preferences that matter to you. Scores explain fit using available data and never predict or guarantee admission.</p></div>
    <form onSubmit={submit} className="grid grid-cols-1 gap-4 rounded-2xl bg-surface p-5 shadow-sm md:grid-cols-2" aria-describedby="match-note">
      <label className="text-sm text-gray-700">Preferred major<input value={form.preferredMajor} onChange={(event) => setForm({ ...form, preferredMajor: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 bg-cream px-3 py-2" autoComplete="off" /></label>
      <label className="text-sm text-gray-700">Preferred city<input value={form.preferredCity} onChange={(event) => setForm({ ...form, preferredCity: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 bg-cream px-3 py-2" autoComplete="address-level2" /></label>
      <label className="text-sm text-gray-700">Maximum tuition (KRW)<input type="number" min="0" value={form.tuitionMax} onChange={(event) => setForm({ ...form, tuitionMax: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 bg-cream px-3 py-2" /></label>
      <label className="text-sm text-gray-700">Maximum QS rank number<input type="number" min="1" max="1000" value={form.rankingMax} onChange={(event) => setForm({ ...form, rankingMax: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 bg-cream px-3 py-2" /></label>
      <label className="text-sm text-gray-700">Study level<select value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 bg-cream px-3 py-2"><option value="">Any level</option><option value="undergraduate">Undergraduate</option><option value="graduate">Graduate</option></select></label>
      <fieldset className="flex flex-wrap items-center gap-4 text-sm text-gray-700"><legend className="sr-only">Additional preferences</legend><label className="flex items-center gap-2"><input type="checkbox" checked={form.englishRequired} onChange={(event) => setForm({ ...form, englishRequired: event.target.checked })} /> English-taught</label><label className="flex items-center gap-2"><input type="checkbox" checked={form.dormitoryRequired} onChange={(event) => setForm({ ...form, dormitoryRequired: event.target.checked })} /> Dormitory</label><label className="flex items-center gap-2"><input type="checkbox" checked={form.scholarshipPreferred} onChange={(event) => setForm({ ...form, scholarshipPreferred: event.target.checked })} /> Scholarships</label></fieldset>
      <p id="match-note" className="text-xs text-muted md:col-span-2">Unknown fields reduce confidence and are shown clearly in each result.</p>
      <button type="submit" disabled={loading} className="rounded-lg bg-navy px-5 py-2.5 font-semibold text-white disabled:opacity-60 md:col-span-2">{loading ? "Finding matches…" : "Show recommendations"}</button>
    </form>
    {message && <p role="status" className="mt-5 rounded-xl border border-gray-200 bg-surface px-4 py-3 text-sm text-muted">{message}</p>}
    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2" aria-live="polite">{!loading && submitted && !results.length && <div className="rounded-2xl bg-surface p-6 text-muted md:col-span-2">No matches were returned. Broaden a preference and try again.</div>}{results.map((result) => <Link key={result.university.id} to={`/universities/${result.university.slug || result.university.id}`} className="rounded-2xl bg-surface p-5 shadow-sm transition-shadow hover:shadow-md"><div className="flex items-center gap-3"><UniversityImage src={result.university.logo} alt={`${result.university.name} logo`} fallbackLabel={result.university.name} color={result.university.mainColor} kind="logo" className="h-11 w-11 shrink-0 object-contain" /><div className="min-w-0"><h2 className="font-bold text-navy">{result.university.name}</h2><p className="text-sm text-muted">{result.university.location} · <strong className="text-teal">{Math.max(0, Math.min(100, Math.round(result.score)))}% match</strong></p></div></div>{result.reasons.length > 0 && <div className="mt-4"><h3 className="text-xs font-semibold uppercase tracking-wide text-teal">Why it matches</h3><ul className="mt-2 space-y-1 text-sm text-gray-700">{result.reasons.map((reason) => <li key={reason}>✓ {reason}</li>)}</ul></div>}{result.disadvantages && result.disadvantages.length > 0 && <div className="mt-4"><h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Consider</h3><ul className="mt-2 space-y-1 text-sm text-gray-700">{result.disadvantages.map((item) => <li key={item}>• {item}</li>)}</ul></div>}</Link>)}</div>
  </div>
}
