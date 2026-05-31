import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { useParams, Link } from "react-router-dom"
import { universities, type University } from "@/data/universities"
import { fetchUniversity, saveDeadlineToAccount } from "@/lib/api"
import { applySeo } from "@/lib/seo"
import { getToken, saveLocalDeadline } from "@/lib/storage"

function formatDate(value?: string | null) {
  if (!value) {
    return "Not announced"
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value))
}

function infoList(values?: string[]) {
  return values && values.length > 0 ? values : ["Information will be updated when the university publishes details."]
}

function UniversityDetail() {
  const { id, idOrSlug } = useParams()
  const identifier = idOrSlug || id || ""
  const numericId = Number(identifier)
  const fallbackUni = Number.isInteger(numericId)
    ? universities.find((u) => u.id === numericId)
    : undefined
  const [loadedUni, setLoadedUni] = useState<University>()
  const [deadlineMessage, setDeadlineMessage] = useState("")
  const reduceMotion = useReducedMotion()
  const uni = loadedUni || fallbackUni
  const isBackendLoaded = Boolean(loadedUni)

  useEffect(() => {
    let ignore = false

    if (!identifier) {
      return () => {
        ignore = true
      }
    }

    fetchUniversity(identifier)
      .then((item) => {
        if (!ignore) {
          setLoadedUni(item)
        }
      })
      .catch(() => undefined)

    return () => {
      ignore = true
    }
  }, [identifier])

  useEffect(() => {
    if (!uni) {
      return
    }

    applySeo({
      title: `${uni.name} | UniChase`,
      description: uni.description,
      image: uni.image,
      canonicalPath: `/universities/${uni.slug || uni.id}`,
      structuredData: {
        "@context": "https://schema.org",
        "@type": "CollegeOrUniversity",
        name: uni.name,
        alternateName: uni.koreanName,
        url: uni.officialWebsite,
        logo: uni.logo,
        address: uni.contact?.address,
      },
    })
  }, [uni])

  const saveDeadline = (deadlineType: "application" | "scholarship" | "document") => {
    if (!uni) {
      return
    }

    saveLocalDeadline({ universityId: uni.id, deadlineType, important: true })
    const token = getToken()

    if (token) {
      saveDeadlineToAccount(token, {
        universityId: uni.id,
        deadlineType,
        important: true,
      }).catch(() => undefined)
    }

    setDeadlineMessage("Deadline saved to your dashboard.")
  }

  if (!uni) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <p className="text-gray-600">University topilmadi.</p>
        <Link to="/university" className="text-indigo-600 hover:underline">
          Back to list
        </Link>
      </div>
    )
  }

  return (
    <motion.div
      key={`${uni.id}-${isBackendLoaded ? "loaded" : "fallback"}`}
      initial={reduceMotion ? false : { opacity: 0.94 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="page-fade max-w-6xl mx-auto px-6 py-8"
    >
      <img
        src={uni.image}
        alt={uni.name}
        className="mt-4 h-64 w-full object-cover rounded-2xl"
      />

      <div className="mt-6 flex items-center gap-4">
        <img
          src={uni.logo}
          alt={`${uni.name} logo`}
          className="h-14 w-14 object-contain"
        />
        <div>
          <h1
            className="text-3xl font-bold"
            style={{ color: uni.mainColor }}
          >
            {uni.name}
          </h1>
          <p className="text-gray-500">{uni.location}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-6">
        {uni.qsRanking && (
          <span className="text-sm text-gray-700">
            QS Ranking: <strong>{uni.qsRanking}</strong>
          </span>
        )}
        {uni.acceptanceRate && (
          <span className="text-sm text-gray-700">
            Acceptance rate: <strong>{uni.acceptanceRate}</strong>
          </span>
        )}
        {uni.deadlines?.status && (
          <span className="text-sm text-gray-700">
            Deadline: <strong>{uni.deadlines.status}</strong>
          </span>
        )}
      </div>

      <p className="mt-6 text-gray-700 leading-relaxed">{uni.description}</p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-surface rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-navy mb-3">Overview</h2>
          <div className="space-y-2 text-sm text-gray-700">
            <p>Type: <strong>{uni.universityType || "Not specified"}</strong></p>
            <p>Country: <strong>{uni.country || "South Korea"}</strong></p>
            <p>Study levels: <strong>{infoList(uni.studyLevels).join(", ")}</strong></p>
            <p>English-taught: <strong>{uni.languageOfInstruction?.includes("English") ? "Available" : "Check program guide"}</strong></p>
          </div>
        </section>

        <section className="bg-surface rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-navy mb-3">Tuition and Rankings</h2>
          <div className="space-y-2 text-sm text-gray-700">
            <p>QS ranking: <strong>{uni.qsRanking || "Not listed"}</strong></p>
            <p>
              Tuition: <strong>{uni.tuition?.min?.toLocaleString() || "N/A"} - {uni.tuition?.max?.toLocaleString() || "N/A"} {uni.tuition?.currency || "KRW"}</strong>
            </p>
            <p>Scholarships: <strong>{uni.hasScholarships ? "Available" : "Check university guide"}</strong></p>
          </div>
        </section>

        <section className="bg-surface rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-navy mb-3">Majors and Programs</h2>
          <div className="flex flex-wrap gap-2">
            {infoList(uni.programs).map((program) => (
              <span key={program} className="text-xs bg-cream border border-gray-200 rounded-full px-3 py-1 text-gray-700">{program}</span>
            ))}
          </div>
        </section>

        <section className="bg-surface rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-navy mb-3">Admission Requirements</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            {infoList(uni.admissionRequirements).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="bg-surface rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-navy mb-3">Housing and Student Support</h2>
          <div className="space-y-3 text-sm text-gray-700">
            <p>{uni.dormitoryHousingInfo || "Housing details should be confirmed with the university."}</p>
            <p>{uni.internationalStudentInfo || "International student support details will be updated."}</p>
            <p>{uni.studentLife || "Student life information will be updated."}</p>
          </div>
        </section>

        <section className="bg-surface rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-navy mb-3">Required Documents</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            {infoList(uni.requiredDocuments).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="bg-surface rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-navy mb-3">Application Steps</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            {infoList(uni.applicationSteps).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="bg-surface rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-navy mb-3">Deadlines</h2>
          <div className="space-y-2 text-sm text-gray-700">
            <p>Application opens: <strong>{formatDate(uni.deadlines?.applicationOpenDate)}</strong></p>
            <p>Application deadline: <strong>{formatDate(uni.deadlines?.applicationDeadline)}</strong></p>
            <p>Scholarship deadline: <strong>{formatDate(uni.deadlines?.scholarshipDeadline)}</strong></p>
            <p>Document deadline: <strong>{formatDate(uni.deadlines?.documentDeadline)}</strong></p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => saveDeadline("application")} className="text-sm bg-navy text-white px-4 py-2 rounded-lg hover:bg-navy-light transition-colors">Save application</button>
            <button onClick={() => saveDeadline("document")} className="text-sm bg-teal text-white px-4 py-2 rounded-lg hover:bg-teal-light transition-colors">Save documents</button>
          </div>
          {deadlineMessage && <p className="mt-3 text-sm text-teal">{deadlineMessage}</p>}
        </section>

        <section className="bg-surface rounded-2xl shadow-sm p-5 md:col-span-2">
          <h2 className="text-lg font-bold text-navy mb-3">Official Links and Contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
            <a href={uni.officialWebsite} target="_blank" rel="noreferrer" className="text-teal hover:underline">Official website</a>
            <p>Email: <strong>{uni.contact?.email || "Not listed"}</strong></p>
            <p>Phone: <strong>{uni.contact?.phone || "Not listed"}</strong></p>
            <p>Address: <strong>{uni.contact?.address || "Not listed"}</strong></p>
          </div>
        </section>
      </div>
    </motion.div>
  )
}

export default UniversityDetail
