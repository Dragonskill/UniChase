import { useEffect, useState, type CSSProperties } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { useParams, Link } from "react-router-dom"
import { universities as fallbackUniversities, type StudentCouncilRole, type University } from "@/data/universities"
import UniversityImage from "@/components/ui/UniversityImage"
import { createApplication, fetchUniversity, fetchUniversityPrograms, fetchUniversityReviews, saveDeadlineToAccount, submitUniversityReview, type Program, type UniversityReview } from "@/lib/api"
import { applySeo } from "@/lib/seo"
import { addRecentlyViewedUniversity, getToken, saveLocalDeadline } from "@/lib/storage"
import { useUniversityState } from "@/lib/universityState"
import { formatUniversityDate as formatDate, verificationLabel, universityVerification } from "@/lib/universityDisplay"

function infoList(values?: string[]) { return values?.length ? values : ["Not verified. Check the official university guide."] }
function roleTitle(role: StudentCouncilRole) { return role.displayName ? `${role.roleTitle} - ${role.displayName}` : role.roleTitle }

export default function UniversityDetail() {
  const { id, idOrSlug } = useParams()
  const identifier = idOrSlug || id || ""
  const [result, setResult] = useState<{ identifier: string; university?: University; error?: string; offline?: boolean }>()
  const uni = result?.identifier === identifier ? result.university : undefined
  const isLoading = result?.identifier !== identifier
  const errorMessage = result?.error
  const [programs, setPrograms] = useState<Program[]>([])
  const [reviews, setReviews] = useState<UniversityReview[]>([])
  const [reviewAverage, setReviewAverage] = useState<number | null>(null)
  const [reviewForm, setReviewForm] = useState({ academics: 5, campusLife: 5, dormitory: 4, internationalSupport: 5, difficulty: 3, costValue: 4, location: 5, overallRating: 5, comment: "" })
  const [reviewMessage, setReviewMessage] = useState("")
  const [reviewPending, setReviewPending] = useState(false)
  const [deadlineMessage, setDeadlineMessage] = useState("")
  const [applicationMessage, setApplicationMessage] = useState("")
  const [applicationPending, setApplicationPending] = useState(false)
  const [shareMessage, setShareMessage] = useState("")
  const reduceMotion = useReducedMotion()
  const state = useUniversityState()

  useEffect(() => {
    let active = true
    fetchUniversity(identifier).then((university) => { if (active) setResult({ identifier, university }) }).catch(() => {
      if (!active) return
      const university = fallbackUniversities.find((item) => item.slug === identifier || item.id === Number(identifier))
      setResult({ identifier, university, offline: true, error: university ? undefined : "University not found. Please try again or return to the directory." })
    })
    return () => { active = false }
  }, [identifier])

  useEffect(() => {
    if (!uni) return
    let active = true
    fetchUniversityPrograms(uni.slug || uni.id).then((items) => { if (active) setPrograms(items) }).catch(() => { if (active) setPrograms([]) })
    fetchUniversityReviews(uni.id).then((response) => {
      if (!active) return
      setReviews(response.data)
      setReviewAverage(response.meta?.average ?? null)
    }).catch(() => { if (active) { setReviews([]); setReviewAverage(null) } })
    applySeo({ title: `${uni.name} | UniChase`, description: uni.description, image: uni.image, canonicalPath: `/universities/${uni.slug || uni.id}`, structuredData: { "@context": "https://schema.org", "@type": "CollegeOrUniversity", name: uni.name, alternateName: uni.koreanName, url: uni.officialWebsite, logo: uni.logo, address: uni.contact?.address } })
    addRecentlyViewedUniversity({ id: uni.id, name: uni.name, slug: uni.slug, city: uni.city || uni.location })
    return () => { active = false }
  }, [uni])

  const sharePage = async () => {
    try {
      if (navigator.share) await navigator.share({ title: uni?.name, url: window.location.href })
      else { await navigator.clipboard.writeText(window.location.href); setShareMessage("Link copied.") }
    } catch { setShareMessage("Use your browser address bar to copy the link.") }
  }

  const saveDeadline = async (deadlineType: "application" | "scholarship" | "document") => {
    if (!uni) return
    const date = uni.deadlines?.[`${deadlineType}Deadline`]
    if (!date || Number.isNaN(Date.parse(date))) { setDeadlineMessage("A verified deadline has not been published yet."); return }
    try {
      const token = getToken()
      if (token) await saveDeadlineToAccount(token, { universityId: uni.id, deadlineType, important: true })
      saveLocalDeadline({ universityId: uni.id, deadlineType, important: true })
      setDeadlineMessage("Deadline saved to your dashboard.")
    } catch { setDeadlineMessage("Could not save this deadline. Please try again.") }
  }

  const addApplicationTracker = async () => {
    if (!uni || applicationPending) return
    const token = getToken()
    if (!token) { setApplicationMessage("Log in to add this university to your application tracker."); return }
    setApplicationPending(true)
    try {
      await createApplication(token, { universityId: uni.id, status: "Interested", applicationDeadline: uni.deadlines?.applicationDeadline || null })
      setApplicationMessage("Application tracker created in your dashboard.")
    } catch { setApplicationMessage("Could not create application tracker. Please try again.") }
    finally { setApplicationPending(false) }
  }

  const submitReview = async () => {
    if (!uni || reviewPending) return
    const token = getToken()
    if (!token) { setReviewMessage("Log in to submit a review."); return }
    if (reviewForm.comment.trim().length < 20) { setReviewMessage("Please write at least 20 characters."); return }
    setReviewPending(true)
    try {
      await submitUniversityReview(token, uni.id, reviewForm)
      setReviewMessage("Your review was submitted and will appear after moderator approval.")
      setReviewForm((current) => ({ ...current, comment: "" }))
    } catch { setReviewMessage("Could not submit your review. Your text is still here; please try again.") }
    finally { setReviewPending(false) }
  }

  if (isLoading) return <div className="max-w-6xl mx-auto px-6 py-8" role="status" aria-label="Loading university"><div className="h-64 rounded-2xl bg-cream-dark animate-pulse" /></div>
  if (!uni) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <p className="text-gray-600">{errorMessage || "University not found."}</p>
        <Link to="/university" className="text-indigo-600 hover:underline">
          Back to list
        </Link>
      </div>
    )
  }

  return (
    <motion.div
      key={uni.id}
      initial={reduceMotion ? false : { opacity: 0.94 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="page-fade max-w-6xl mx-auto px-6 py-8"
    >
      <div className="mb-4 flex items-center gap-2 text-sm text-muted">
        <Link to="/" className="hover:text-teal">Home</Link>
        <span>/</span>
        <Link to="/university" className="hover:text-teal">Universities</Link>
        <span>/</span>
        <span className="text-ink">{uni.name}</span>
      </div>

      <UniversityImage
        src={uni.image}
        alt={uni.imageAlt || `${uni.name} campus image`}
        fallbackLabel={uni.name}
        color={uni.mainColor}
        loading="eager"
        className="mt-4 h-64 w-full object-cover rounded-2xl bg-cream-dark"
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
        <UniversityImage
          src={uni.logo}
          alt={`${uni.name} logo`}
          fallbackLabel={uni.name}
          color={uni.mainColor}
          kind="logo"
          className="h-14 w-14 object-contain"
        />
        <div>
          <h1
            className="university-card-title text-3xl font-bold"
            style={{ "--uni-color": uni.mainColor } as CSSProperties}
          >
            {uni.name}
          </h1>
          <p className="text-gray-500">{uni.location}</p>
        </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-gray-200 bg-cream px-3 py-1 text-xs text-muted">
            {universityVerification(uni)}
          </span>
          <button type="button" onClick={() => state.toggleFollowed(uni.id)} aria-pressed={state.followedIds.includes(uni.id)} className="rounded-full border border-teal px-4 py-2 text-sm text-teal">{state.followedIds.includes(uni.id) ? "Followed" : "+ Follow"}</button><button type="button" onClick={() => state.toggleSaved(uni.id)} aria-pressed={state.savedIds.includes(uni.id)} className="rounded-full border border-gray-200 px-4 py-2 text-sm">{state.savedIds.includes(uni.id) ? "Saved" : "Save"}</button><button type="button" disabled={!state.compareIds.includes(uni.id) && state.compareIds.length >= 4} onClick={() => state.toggleCompare(uni.id)} aria-pressed={state.compareIds.includes(uni.id)} className="rounded-full border border-gray-200 px-4 py-2 text-sm">{state.compareIds.includes(uni.id) ? "In comparison" : "Compare"}</button><button onClick={sharePage} className="rounded-full border border-gray-200 bg-surface px-4 py-2 text-sm text-muted hover:text-teal">
            Share
          </button>
          <button disabled={applicationPending} onClick={addApplicationTracker} className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
            Track application
          </button>
        </div>
      </div>
      {state.message && <p role="status" className="mt-2 text-sm text-muted">{state.message}</p>}{result?.offline && <p className="mt-2 text-sm text-muted">Showing the saved directory. Live updates are temporarily unavailable.</p>}{shareMessage && <p className="mt-2 text-sm text-teal">{shareMessage}</p>}
      {applicationMessage && <p className="mt-2 text-sm text-teal">{applicationMessage}</p>}

      <div className="mt-4 flex flex-wrap gap-6">
        <span className="text-sm text-gray-700">
          QS Ranking: <strong>{uni.qsRanking || "Not available"}</strong>
        </span>
        <span className="text-sm text-gray-700">
          Acceptance rate: <strong>{uni.acceptanceRate || "Not available"}</strong>
        </span>
        {uni.deadlines?.status && (
          <span className="text-sm text-gray-700">
            Deadline: <strong>{uni.deadlines.status}</strong>
          </span>
        )}
      </div>

      <p className="mt-6 text-gray-700 leading-relaxed">{uni.fullDescription || uni.description}</p>

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
            <p>QS ranking: <strong>{uni.qsRanking || "Not available"}</strong></p>
            <p>Ranking year: <strong>{uni.qsRankingYear || "Not available"}</strong></p>
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
            {uni.imageSourceUrl && <a href={uni.imageSourceUrl} target="_blank" rel="noreferrer" className="text-teal hover:underline">Image source</a>}
            <p>Email: <strong>{uni.contact?.email || "Not listed"}</strong></p>
            <p>Phone: <strong>{uni.contact?.phone || "Not listed"}</strong></p>
            <p>Address: <strong>{uni.contact?.address || "Not listed"}</strong></p>
          </div>
          {uni.sourceUrls && uni.sourceUrls.length > 0 && (
            <div className="mt-5">
              <h3 className="text-sm font-semibold text-navy">Data sources</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {uni.sourceUrls.map((source) => (
                  <a key={source} href={source} target="_blank" rel="noreferrer" className="text-xs bg-cream border border-gray-200 rounded-full px-3 py-1 text-teal hover:underline">
                    Source
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="bg-surface rounded-2xl shadow-sm p-5 md:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div>
              <h2 className="text-lg font-bold text-navy">Student Council</h2>
              <p className="text-sm text-muted">{uni.studentCouncil?.name || "Student council information is being verified."}</p>
            </div>
            <span className="text-xs bg-cream border border-gray-200 rounded-full px-3 py-1 text-gray-700">
              {verificationLabel(uni.studentCouncil?.verificationStatus)}
            </span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            {uni.studentCouncil?.description || "No verified student council profile is available yet."}
          </p>
          {(uni.studentCouncil?.websiteUrl || uni.studentCouncil?.socialUrl || uni.studentCouncil?.contactEmail) && (
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              {uni.studentCouncil.websiteUrl && <a href={uni.studentCouncil.websiteUrl} target="_blank" rel="noreferrer" className="text-teal hover:underline">Council website</a>}
              {uni.studentCouncil.socialUrl && <a href={uni.studentCouncil.socialUrl} target="_blank" rel="noreferrer" className="text-teal hover:underline">Social link</a>}
              {uni.studentCouncil.contactEmail && <span className="text-gray-700">Email: <strong>{uni.studentCouncil.contactEmail}</strong></span>}
            </div>
          )}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            {(uni.studentCouncil?.roles || []).map((role) => (
              <div key={role.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-navy">{roleTitle(role)}</h3>
                  <span className="text-xs bg-cream border border-gray-200 rounded-full px-3 py-1 text-gray-700">{verificationLabel(role.verificationStatus)}</span>
                </div>
                {role.department && <p className="text-xs text-muted mt-1">{role.department}</p>}
                <p className="text-sm text-gray-700 mt-2">{role.description || "Role details need verification."}</p>
                {role.responsibilities && role.responsibilities.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm text-gray-700">
                    {role.responsibilities.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                )}
              </div>
            ))}
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
                aria-label="Written university review" maxLength={10000} placeholder="Share helpful details for future applicants..."
                className="mt-3 w-full bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              />
              <button disabled={reviewPending} onClick={submitReview} className="mt-2 text-sm bg-navy text-white px-4 py-2 rounded-lg hover:bg-navy-light transition-colors">Submit review</button>
              {reviewMessage && <p className="mt-2 text-sm text-teal">{reviewMessage}</p>}
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  )
}
