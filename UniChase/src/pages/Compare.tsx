import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import type { University } from "@/data/universities"
import { fetchComparedUniversities } from "@/lib/api"
import { applySeo } from "@/lib/seo"
import { getCompareUniversityIds, setCompareUniversityIds } from "@/lib/storage"

function tuition(uni: University) {
  if (!uni.tuition?.min && !uni.tuition?.max) {
    return "Not listed"
  }

  return `${uni.tuition?.min?.toLocaleString() || "N/A"} - ${uni.tuition?.max?.toLocaleString() || "N/A"} ${uni.tuition?.currency || "KRW"}`
}

export default function Compare() {
  const [ids, setIds] = useState<number[]>(() => getCompareUniversityIds())
  const [universities, setUniversities] = useState<University[]>([])

  useEffect(() => {
    applySeo({
      title: "Compare Universities | UniChase",
      description: "Compare Korean universities side by side by ranking, tuition, majors, deadlines, and support.",
      canonicalPath: "/compare",
    })
  }, [])

  useEffect(() => {
    if (ids.length < 2) {
      return
    }

    fetchComparedUniversities(ids).then(setUniversities).catch(() => undefined)
  }, [ids])

  const remove = (id: number) => {
    const next = ids.filter((item) => item !== id)
    setIds(next)
    setCompareUniversityIds(next)
    setUniversities((current) => current.filter((item) => item.id !== id))
  }

  if (ids.length < 2) {
    return (
      <div className="page-fade max-w-6xl mx-auto px-6 py-8">
        <div className="bg-surface rounded-2xl shadow-sm p-6">
          <h1 className="text-2xl font-bold text-navy">Compare universities</h1>
          <p className="text-muted mt-2">Select 2 to 4 universities from the university page to compare them here.</p>
          <Link to="/university" className="inline-block mt-4 text-sm text-teal hover:underline">Choose universities</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-fade max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-navy">Compare universities</h1>
        <Link to="/university" className="text-sm text-muted hover:text-teal transition-colors">Add more</Link>
      </div>

      <div className="overflow-x-auto bg-surface rounded-2xl shadow-sm">
        <table className="w-full text-sm text-left min-w-[760px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="p-4 text-navy">Field</th>
              {universities.map((uni) => (
                <th key={uni.id} className="p-4 text-navy">
                  <div className="flex items-center gap-3">
                    <img src={uni.logo} alt={`${uni.name} logo`} className="h-8 w-8 object-contain" />
                    <span>{uni.name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[
              ["City", (uni: University) => uni.location],
              ["QS ranking", (uni: University) => uni.qsRanking || "Not listed"],
              ["Tuition", tuition],
              ["Majors", (uni: University) => uni.programs?.join(", ") || "Not listed"],
              ["English-taught", (uni: University) => uni.languageOfInstruction?.includes("English") ? "Available" : "Check guide"],
              ["Requirements", (uni: University) => uni.admissionRequirements?.join(", ") || "Not listed"],
              ["Dormitory", (uni: University) => uni.dormitoryHousingInfo || "Check guide"],
              ["International support", (uni: University) => uni.internationalStudentInfo || "Check guide"],
              ["Application deadline", (uni: University) => uni.deadlines?.applicationDeadline ? new Date(uni.deadlines.applicationDeadline).toLocaleDateString() : "Not announced"],
              ["Official website", (uni: University) => uni.officialWebsite || "Not listed"],
            ].map(([label, render]) => (
              <tr key={label as string}>
                <td className="p-4 font-medium text-navy align-top">{label as string}</td>
                {universities.map((uni) => (
                  <td key={uni.id} className="p-4 text-gray-700 align-top">
                    {label === "Official website" ? (
                      <a href={uni.officialWebsite} target="_blank" rel="noreferrer" className="text-teal hover:underline">Open website</a>
                    ) : (
                      (render as (uni: University) => string)(uni)
                    )}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="p-4 font-medium text-navy">Actions</td>
              {universities.map((uni) => (
                <td key={uni.id} className="p-4">
                  <button onClick={() => remove(uni.id)} className="text-sm text-muted hover:text-teal transition-colors">Remove</button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
