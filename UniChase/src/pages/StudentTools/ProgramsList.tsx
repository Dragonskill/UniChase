import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import GlowLetters from "@/components/ui/GlowLetters"
import { fetchPrograms, type Program } from "@/lib/api"
import { applySeo } from "@/lib/seo"
import { buildLocalPrograms } from "@/lib/studentToolsLocal"

export default function ProgramsList() {
  const [programs, setPrograms] = useState<Program[]>(() => buildLocalPrograms())
  const [query, setQuery] = useState("")
  const [level, setLevel] = useState("")
  const [language, setLanguage] = useState("")

  useEffect(() => {
    applySeo({
      title: "Program Finder | UniChase",
      description: "Browse South Korean university programs by university, degree level, language, tuition, and requirements.",
      canonicalPath: "/programs",
    })
  }, [])

  useEffect(() => {
    let ignore = false

    fetchPrograms({ q: query, degreeLevel: level, language })
      .then((items) => {
        if (!ignore) {
          setPrograms(items.length ? items : buildLocalPrograms())
        }
      })
      .catch(() => {
        if (!ignore) {
          setPrograms(buildLocalPrograms())
        }
      })

    return () => {
      ignore = true
    }
  }, [query, level, language])

  const visiblePrograms = useMemo(() => {
    const q = query.trim().toLowerCase()
    return programs.filter((program) => {
      const matchesQuery =
        !q ||
        program.name.toLowerCase().includes(q) ||
        program.university?.name.toLowerCase().includes(q) ||
        program.degreeLevel.toLowerCase().includes(q)
      const matchesLevel = !level || program.degreeLevel.toLowerCase().includes(level.toLowerCase())
      const matchesLanguage = !language || program.languageOfInstruction.toLowerCase().includes(language.toLowerCase())
      return matchesQuery && matchesLevel && matchesLanguage
    })
  }, [language, level, programs, query])

  return (
    <div className="page-fade max-w-6xl mx-auto px-6 py-8">
      <div className="mb-6">
        <p className="text-sm text-teal font-semibold">Student tools</p>
        <h1 className="text-3xl font-bold text-navy">
          <GlowLetters text="Program finder" />
        </h1>
        <p className="mt-2 text-sm text-muted max-w-2xl">
          Browse program-level details without changing the existing university discovery flow.
        </p>
      </div>

      <section className="bg-surface rounded-2xl shadow-sm p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search programs or universities"
            className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          />
          <select
            value={level}
            onChange={(event) => setLevel(event.target.value)}
            className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          >
            <option value="">All levels</option>
            <option value="undergraduate">Undergraduate</option>
            <option value="graduate">Graduate</option>
            <option value="master">Master</option>
          </select>
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          >
            <option value="">All languages</option>
            <option value="English">English</option>
            <option value="Korean">Korean</option>
          </select>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {visiblePrograms.map((program) => (
            <Link
              key={program.slug}
              to={`/programs/${program.slug}`}
              className="bg-surface rounded-2xl shadow-sm p-5 transition-transform hover:-translate-y-1"
            >
              <p className="text-xs text-muted">{program.university?.name || "University"}</p>
              <h2 className="mt-1 text-lg font-bold text-navy">{program.name}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-xs bg-cream border border-gray-200 rounded-full px-3 py-1 text-gray-700">
                  {program.degreeLevel}
                </span>
                <span className="text-xs bg-cream border border-gray-200 rounded-full px-3 py-1 text-gray-700">
                  {program.languageOfInstruction}
                </span>
              </div>
              <p className="mt-3 text-sm text-gray-700">
                Tuition: {program.tuition?.min?.toLocaleString() || "N/A"} - {program.tuition?.max?.toLocaleString() || "N/A"}{" "}
                {program.tuition?.currency || "KRW"}
              </p>
            </Link>
          ))}
      </div>
    </div>
  )
}
