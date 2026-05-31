import { useEffect, useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { fetchRecommendations, type Recommendation } from "@/lib/api"
import { applySeo } from "@/lib/seo"

export default function Match() {
  const [form, setForm] = useState({
    preferredMajor: "",
    tuitionMax: "",
    preferredCity: "",
    englishRequired: true,
    dormitoryRequired: false,
    rankingMax: "",
    level: "",
    scholarshipPreferred: false,
  })
  const [results, setResults] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    applySeo({
      title: "Find My Best University Match | UniChase",
      description: "Get rule-based Korean university recommendations by major, budget, city, language, dormitory, and ranking preferences.",
      canonicalPath: "/match",
    })
  }, [])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    fetchRecommendations({
      preferredMajor: form.preferredMajor,
      tuitionMax: form.tuitionMax ? Number(form.tuitionMax) : undefined,
      preferredCity: form.preferredCity,
      englishRequired: form.englishRequired,
      dormitoryRequired: form.dormitoryRequired,
      rankingMax: form.rankingMax ? Number(form.rankingMax) : undefined,
      level: form.level,
      scholarshipPreferred: form.scholarshipPreferred,
    })
      .then(setResults)
      .finally(() => setLoading(false))
  }

  return (
    <div className="page-fade max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-navy mb-6">Find My Best University Match</h1>
      <form onSubmit={submit} className="bg-surface rounded-2xl shadow-sm p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <input value={form.preferredMajor} onChange={(e) => setForm({ ...form, preferredMajor: e.target.value })} placeholder="Preferred major" className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
        <input value={form.preferredCity} onChange={(e) => setForm({ ...form, preferredCity: e.target.value })} placeholder="Preferred city" className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
        <input value={form.tuitionMax} onChange={(e) => setForm({ ...form, tuitionMax: e.target.value })} placeholder="Maximum tuition budget" inputMode="numeric" className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
        <input value={form.rankingMax} onChange={(e) => setForm({ ...form, rankingMax: e.target.value })} placeholder="Best acceptable QS rank" inputMode="numeric" className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
        <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal">
          <option value="">Study level</option>
          <option value="undergraduate">Undergraduate</option>
          <option value="graduate">Graduate</option>
        </select>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.englishRequired} onChange={(e) => setForm({ ...form, englishRequired: e.target.checked })} /> English-taught</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.dormitoryRequired} onChange={(e) => setForm({ ...form, dormitoryRequired: e.target.checked })} /> Dormitory</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.scholarshipPreferred} onChange={(e) => setForm({ ...form, scholarshipPreferred: e.target.checked })} /> Scholarships</label>
        </div>
        <button type="submit" className="md:col-span-2 bg-navy text-white px-5 py-2 rounded-lg font-semibold hover:bg-navy-light transition-colors">{loading ? "Finding matches..." : "Show recommendations"}</button>
      </form>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.map((result) => (
          <Link key={result.university.id} to={`/universities/${result.university.slug || result.university.id}`} className="bg-surface rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <img src={result.university.logo} alt={`${result.university.name} logo`} className="h-10 w-10 object-contain" />
              <div>
                <h2 className="font-bold text-navy">{result.university.name}</h2>
                <p className="text-sm text-muted">{result.university.location} · Score {result.score}</p>
              </div>
            </div>
            <ul className="mt-4 space-y-1 text-sm text-gray-700">
              {result.reasons.map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
          </Link>
        ))}
      </div>
    </div>
  )
}
