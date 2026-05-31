import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import GlowLetters from "@/components/ui/GlowLetters"
import { fetchProgram, type Program } from "@/lib/api"
import { applySeo } from "@/lib/seo"
import { buildLocalPrograms } from "@/lib/studentToolsLocal"

function list(values: string[]) {
  return values.length ? values : ["Check the official program page for updated details."]
}

export default function ProgramDetail() {
  const { slug = "" } = useParams()
  const [program, setProgram] = useState<Program | null>(null)

  useEffect(() => {
    let ignore = false
    fetchProgram(slug)
      .then((item) => {
        if (!ignore) setProgram(item)
      })
      .catch(() => {
        const fallback = buildLocalPrograms().find((item) => item.slug === slug)
        if (!ignore) setProgram(fallback || null)
      })

    return () => {
      ignore = true
    }
  }, [slug])

  useEffect(() => {
    if (!program) return
    applySeo({
      title: `${program.name} | UniChase Programs`,
      description: `Program details for ${program.name} at ${program.university?.name || "a South Korean university"}.`,
      canonicalPath: `/programs/${program.slug}`,
    })
  }, [program])

  if (!program) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <p className="text-sm text-muted">Program not found.</p>
        <Link to="/programs" className="text-teal hover:underline">Back to programs</Link>
      </div>
    )
  }

  return (
    <div className="page-fade max-w-6xl mx-auto px-6 py-8">
      <Link to="/programs" className="text-sm text-teal hover:underline">Back to programs</Link>
      <div className="mt-4">
        <p className="text-sm text-muted">{program.university?.name}</p>
        <h1 className="text-3xl font-bold text-navy">
          <GlowLetters text={program.name} />
        </h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs bg-cream border border-gray-200 rounded-full px-3 py-1 text-gray-700">{program.degreeLevel}</span>
          <span className="text-xs bg-cream border border-gray-200 rounded-full px-3 py-1 text-gray-700">{program.languageOfInstruction}</span>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-surface rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-navy mb-3">Program overview</h2>
          <div className="space-y-2 text-sm text-gray-700">
            <p>Duration: <strong>{program.duration || "Check official guide"}</strong></p>
            <p>
              Tuition: <strong>{program.tuition?.min?.toLocaleString() || "N/A"} - {program.tuition?.max?.toLocaleString() || "N/A"} {program.tuition?.currency || "KRW"}</strong>
            </p>
            <p>Application period: <strong>{program.applicationPeriod || "Check official guide"}</strong></p>
          </div>
        </section>

        <section className="bg-surface rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-navy mb-3">Start planning</h2>
          <div className="flex flex-wrap gap-2">
            <Link to="/roadmap" className="text-sm bg-navy text-white px-4 py-2 rounded-lg hover:bg-navy-light transition-colors">Build roadmap</Link>
            <Link to="/documents" className="text-sm bg-teal text-white px-4 py-2 rounded-lg hover:bg-teal-light transition-colors">Create checklist</Link>
            <Link to="/eligibility" className="text-sm border border-gray-200 px-4 py-2 rounded-lg text-navy hover:border-teal transition-colors">Check eligibility</Link>
          </div>
        </section>

        <section className="bg-surface rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-navy mb-3">Requirements</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            {list(program.requirements).map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>

        <section className="bg-surface rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-navy mb-3">Required documents</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            {list(program.requiredDocuments).map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>

        <section className="bg-surface rounded-2xl shadow-sm p-5 md:col-span-2">
          <h2 className="text-lg font-bold text-navy mb-3">Career outcomes</h2>
          <div className="flex flex-wrap gap-2">
            {list(program.careerOutcomes).map((item) => (
              <span key={item} className="text-xs bg-cream border border-gray-200 rounded-full px-3 py-1 text-gray-700">{item}</span>
            ))}
          </div>
          {program.officialLink && (
            <a href={program.officialLink} target="_blank" rel="noreferrer" className="inline-block mt-4 text-sm text-teal hover:underline">
              Official program information
            </a>
          )}
        </section>
      </div>
    </div>
  )
}

