import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { useParams, Link } from "react-router-dom"
import { universities, type University } from "@/data/universities"
import {
  fetchUniversity,
  fetchUniversityPrograms,
  fetchUniversityReviews,
  saveDeadlineToAccount,
  submitUniversityReview,
  type Program,
  type UniversityReview,
} from "@/lib/api"
import { isLocalAuthToken } from "@/lib/authSession"
import { applySeo } from "@/lib/seo"
import { getToken, saveLocalDeadline } from "@/lib/storage"
import { getLocalReviews, saveLocalReview } from "@/lib/studentToolsLocal"

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
  const [programs, setPrograms] = useState<Program[]>([])
  const [reviews, setReviews] = useState<UniversityReview[]>([])
  const [reviewAverage, setReviewAverage] = useState<number | null>(null)
  const [reviewForm, setReviewForm] = useState({
    academics: 5,
    campusLife: 5,
    dormitory: 4,
    internationalSupport: 5,
    difficulty: 3,
    costValue: 4,
    location: 5,
    overallRating: 5,
    comment: "",
  })
  const [reviewMessage, setReviewMessage] = useState("")
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

    let ignore = false

    fetchUniversityPrograms(uni.slug || uni.id)
      .then((items) => {
        if (!ignore) {
          setPrograms(items)
        }
      })
      .catch(() => undefined)

    fetchUniversityReviews(uni.id)
      .then((response) => {
        if (!ignore) {
          const localReviews = getLocalReviews(uni.id)
          const merged = [...localReviews, ...response.data]
          setReviews(merged)
          setReviewAverage(
            response.meta?.average || (merged.length ? Math.round((merged.reduce((sum, item) => sum + item.overallRating, 0) / merged.length) * 10) / 10 : null),
          )
        }
      })
      .catch(() => {
        if (!ignore) {
          const localReviews = getLocalReviews(uni.id)
          setReviews(localReviews)
          setReviewAverage(localReviews.length ? Math.round((localReviews.reduce((sum, item) => sum + item.overallRating, 0) / localReviews.length) * 10) / 10 : null)
        }
      })

    return () => {
      ignore = true
    }
  }, [uni])

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

  const submitReview = async () => {
    if (!uni) {
      return
    }

    if (reviewForm.comment.trim().length < 20) {
      setReviewMessage("Please write at least 20 characters.")
      return
    }

    const token = getToken()

    if (token && !isLocalAuthToken(token)) {
      try {
        const created = await submitUniversityReview(token, uni.id, reviewForm)
        setReviews((items) => [created, ...items])
        setReviewMessage("Review added.")
        setReviewForm((current) => ({ ...current, comment: "" }))
        return
      } catch {
        setReviewMessage("Backend unavailable, saved locally.")
      }
    }

    const created = saveLocalReview({
      ...reviewForm,
      universityId: uni.id,
      author: null,
    })
    setReviews((items) => [created, ...items])
    setReviewForm((current) => ({ ...current, comment: "" }))
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
          {programs.length > 0 && (
            <div className="mt-4 space-y-2">
              {programs.slice(0, 4).map((program) => (
                <Link key={program.slug} to={`/programs/${program.slug}`} className="block text-sm text-teal hover:underline">
                  {program.name} program details
                </Link>
              ))}
            </div>
          )}
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

        <section className="bg-surface rounded-2xl shadow-sm p-5 md:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-bold text-navy">Student Reviews</h2>
              <p className="text-sm text-muted">
                {reviewAverage ? `${reviewAverage}/5 average from ${reviews.length} review${reviews.length === 1 ? "" : "s"}` : "No reviews yet."}
              </p>
            </div>
            <Link to="/reviews" className="text-sm text-teal hover:underline">All reviews</Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-3">
              {reviews.length === 0 && <p className="text-sm text-muted">Be the first to add a student review.</p>}
              {reviews.slice(0, 3).map((review) => (
                <div key={review.id || review.comment} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <strong className="text-navy">{review.author?.name || "Student"}</strong>
                    <span className="text-teal font-semibold">{review.overallRating}/5</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-700">{review.comment}</p>
                </div>
              ))}
            </div>

            <div>
              <div className="grid grid-cols-2 gap-2">
                {(["academics", "campusLife", "dormitory", "internationalSupport", "difficulty", "costValue", "location", "overallRating"] as const).map((field) => (
                  <label key={field} className="text-xs text-gray-700">
                    {field.replace(/([A-Z])/g, " $1")}
                    <select
                      value={reviewForm[field]}
                      onChange={(event) => setReviewForm({ ...reviewForm, [field]: Number(event.target.value) })}
                      className="mt-1 w-full bg-cream border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                    >
                      {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </label>
                ))}
              </div>
              <textarea
                value={reviewForm.comment}
                onChange={(event) => setReviewForm({ ...reviewForm, comment: event.target.value })}
                rows={4}
                placeholder="Share helpful details for future applicants..."
                className="mt-3 w-full bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              />
              <button onClick={submitReview} className="mt-2 text-sm bg-navy text-white px-4 py-2 rounded-lg hover:bg-navy-light transition-colors">Submit review</button>
              {reviewMessage && <p className="mt-2 text-sm text-teal">{reviewMessage}</p>}
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  )
}

export default UniversityDetail
