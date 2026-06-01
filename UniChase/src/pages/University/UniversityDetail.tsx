import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { useParams, Link } from "react-router-dom"
import { universities as fallbackUniversities, type StudentCouncilRole, type University } from "@/data/universities"
import UniversityImage from "@/components/ui/UniversityImage"
import { fetchUniversity, saveDeadlineToAccount } from "@/lib/api"
import { applySeo } from "@/lib/seo"
import { addRecentlyViewedUniversity, getToken, saveLocalDeadline } from "@/lib/storage"

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

function verificationLabel(status?: string) {
  if (status === "verified") {
    return "Verified"
  }

  if (status === "manually added") {
    return "Manually Added"
  }

  return "Needs Verification"
}

function roleTitle(role: StudentCouncilRole) {
  return role.displayName ? `${role.roleTitle} - ${role.displayName}` : role.roleTitle
}

function findFallbackUniversity(identifier: string) {
  const numericId = Number(identifier)
  return fallbackUniversities.find((university) => university.slug === identifier || university.id === numericId)
}

function UniversityDetail() {
  const { id, idOrSlug } = useParams()
  const identifier = idOrSlug || id || ""
  const [loadedUni, setLoadedUni] = useState<University>()
  const [isLoading, setIsLoading] = useState(Boolean(identifier))
  const [errorMessage, setErrorMessage] = useState(() => (identifier ? "" : "University not found."))
  const [deadlineMessage, setDeadlineMessage] = useState("")
  const [shareMessage, setShareMessage] = useState("")
  const reduceMotion = useReducedMotion()
  const uni = loadedUni
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
          setErrorMessage("")
        }
      })
      .catch(() => {
        if (!ignore) {
          const fallbackUniversity = findFallbackUniversity(identifier)
          if (fallbackUniversity) {
            setLoadedUni(fallbackUniversity)
            setErrorMessage("")
          } else {
            setErrorMessage("Could not load this university from the UniChase API.")
          }
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false)
        }
      })

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
    addRecentlyViewedUniversity({
      id: uni.id,
      name: uni.name,
      slug: uni.slug,
      city: uni.city || uni.location,
    })
  }, [uni])

  const sharePage = async () => {
    const url = window.location.href

    if (navigator.share) {
      await navigator.share({ title: uni?.name || "UniChase university", url }).catch(() => undefined)
      return
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url)
      setShareMessage("Link copied.")
    } else {
      setShareMessage(url)
    }
    window.setTimeout(() => setShareMessage(""), 2200)
  }

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

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="h-64 w-full rounded-2xl bg-cream-dark animate-pulse" />
        <div className="mt-6 h-8 w-64 rounded bg-cream-dark animate-pulse" />
        <div className="mt-4 h-4 w-full max-w-2xl rounded bg-cream-dark animate-pulse" />
      </div>
    )
  }

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
      key={`${uni.id}-${isBackendLoaded ? "loaded" : "fallback"}`}
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
            className="text-3xl font-bold"
            style={{ color: uni.mainColor }}
          >
            {uni.name}
          </h1>
          <p className="text-gray-500">{uni.location}</p>
        </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-gray-200 bg-cream px-3 py-1 text-xs text-muted">
            {uni.imageLastVerifiedAt || uni.lastVerifiedAt ? "Verified" : "Needs verification"}
          </span>
          <button onClick={sharePage} className="rounded-full border border-gray-200 bg-surface px-4 py-2 text-sm text-muted hover:text-teal">
            Share
          </button>
        </div>
      </div>
      {shareMessage && <p className="mt-2 text-sm text-teal">{shareMessage}</p>}

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
      </div>
    </motion.div>
  )
}

export default UniversityDetail
