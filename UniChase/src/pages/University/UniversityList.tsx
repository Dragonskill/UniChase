import { useEffect, useMemo, useState, type FormEvent } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Link, useSearchParams } from "react-router-dom"
import { universities as fallbackUniversities, type University } from "@/data/universities"
import UniversityCard from "@/components/ui/UniversityCard"
import { fetchFilteredUniversities, removeUniversityFromAccount, saveUniversityToAccount } from "@/lib/api"
import {
  addRecentSearch,
  getCompareUniversityIds,
  getRecentSearches,
  getSavedUniversityIds,
  getToken,
  toggleCompareUniversity,
  toggleSavedUniversity,
} from "@/lib/storage"
import { applySeo } from "@/lib/seo"

type FilterState = {
  search: string
  city: string
  rankingMin: string
  rankingMax: string
  tuitionMin: string
  tuitionMax: string
  major: string
  language: string
  dormitory: string
  type: string
  deadline: string
  level: string
}

const initialFilters: FilterState = {
  search: "",
  city: "",
  rankingMin: "",
  rankingMax: "",
  tuitionMin: "",
  tuitionMax: "",
  major: "",
  language: "",
  dormitory: "",
  type: "",
  deadline: "",
  level: "",
}

function normalized(value?: string | null) {
  return (value || "").toLowerCase()
}

function rankingNumber(university: University) {
  if (typeof university.qsRankingNumber === "number") {
    return university.qsRankingNumber
  }

  const match = university.qsRanking?.match(/\d+/)
  return match ? Number(match[0]) : null
}

function applyFallbackFilters(items: University[], filters: FilterState) {
  const search = normalized(filters.search)

  return items.filter((university) => {
    const rank = rankingNumber(university)
    const tuitionMin = university.tuition?.min ?? null
    const tuitionMax = university.tuition?.max ?? null
    const searchable = [
      university.name,
      university.koreanName,
      university.city,
      university.location,
      university.description,
      ...(university.programs || []),
      university.studentCouncil?.name,
      ...(university.studentCouncil?.roles || []).flatMap((role) => [
        role.roleTitle,
        role.department,
        role.description,
        ...(role.responsibilities || []),
      ]),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()

    if (search && !searchable.includes(search)) return false
    if (filters.city && !normalized(university.city || university.location).includes(normalized(filters.city))) return false
    if (filters.major && !(university.programs || []).some((program) => normalized(program).includes(normalized(filters.major)))) return false
    if (filters.language && !(university.languageOfInstruction || []).some((language) => normalized(language).includes(normalized(filters.language)))) return false
    if (filters.type && university.universityType !== filters.type) return false
    if (filters.level && !(university.studyLevels || []).some((level) => normalized(level).includes(normalized(filters.level)))) return false
    if (filters.dormitory && university.hasDormitory !== (filters.dormitory === "true")) return false
    if (filters.rankingMin && (rank === null || rank < Number(filters.rankingMin))) return false
    if (filters.rankingMax && (rank === null || rank > Number(filters.rankingMax))) return false
    if (filters.tuitionMin && (tuitionMax === null || tuitionMax < Number(filters.tuitionMin))) return false
    if (filters.tuitionMax && (tuitionMin === null || tuitionMin > Number(filters.tuitionMax))) return false
    if (filters.deadline && normalized(university.deadlines?.status) !== normalized(filters.deadline)) return false

    return true
  })
}

function UniversityList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState<FilterState>(() => ({
    ...initialFilters,
    search: searchParams.get("search") || "",
  }))
  const [universityList, setUniversityList] = useState<University[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [savedIds, setSavedIds] = useState<number[]>(() => getSavedUniversityIds())
  const [compareIds, setCompareIds] = useState<number[]>(() => getCompareUniversityIds())
  const [recentSearches, setRecentSearches] = useState<string[]>(() => getRecentSearches())
  const reduceMotion = useReducedMotion()

  const queryFilters = useMemo(
    () => ({
      search: filters.search,
      city: filters.city,
      rankingMin: filters.rankingMin,
      rankingMax: filters.rankingMax,
      tuitionMin: filters.tuitionMin,
      tuitionMax: filters.tuitionMax,
      major: filters.major,
      language: filters.language,
      dormitory: filters.dormitory,
      type: filters.type,
      deadline: filters.deadline,
      level: filters.level,
    }),
    [filters],
  )

  useEffect(() => {
    applySeo({
      title: "Korean Universities | UniChase",
      description: "Search, filter, save, and compare Korean universities for international study.",
      canonicalPath: "/university",
    })
  }, [])

  useEffect(() => {
    let ignore = false

    const timeout = window.setTimeout(() => {
      setIsLoading(true)
      fetchFilteredUniversities(queryFilters)
        .then((items) => {
          if (!ignore) {
            setUniversityList(items.length > 0 ? items : applyFallbackFilters(fallbackUniversities, queryFilters))
            setErrorMessage("")
          }
        })
        .catch(() => {
          if (!ignore) {
            const fallbackItems = applyFallbackFilters(fallbackUniversities, queryFilters)
            setUniversityList(fallbackItems)
            setErrorMessage(fallbackItems.length > 0 ? "" : "Could not load universities from the UniChase API. Start the API and seed the database, then try again.")
          }
        })
        .finally(() => {
          if (!ignore) {
            setIsLoading(false)
          }
        })
    }, 220)

    return () => {
      ignore = true
      window.clearTimeout(timeout)
    }
  }, [queryFilters])

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  const submitFilters = (event: FormEvent) => {
    event.preventDefault()

    if (filters.search.trim()) {
      addRecentSearch(filters.search)
      setRecentSearches(getRecentSearches())
      setSearchParams({ search: filters.search.trim() })
    } else {
      setSearchParams({})
    }
  }

  const resetFilters = () => {
    setFilters(initialFilters)
    setSearchParams({})
  }

  const handleSaved = (id: number) => {
    const next = toggleSavedUniversity(id)
    setSavedIds(next)

    const token = getToken()
    if (token) {
      if (next.includes(id)) {
        saveUniversityToAccount(token, id).catch(() => undefined)
      } else {
        removeUniversityFromAccount(token, id).catch(() => undefined)
      }
    }
  }

  const handleCompare = (id: number) => {
    const next = toggleCompareUniversity(id)
    setCompareIds(next)
  }

  return (
    <div className="page-fade max-w-6xl mx-auto px-6 py-8">
      <form onSubmit={submitFilters} className="mb-6 bg-surface rounded-2xl shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            placeholder="Search universities, majors, city"
            className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          />
          <input
            value={filters.city}
            onChange={(e) => updateFilter("city", e.target.value)}
            placeholder="City"
            className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          />
          <input
            value={filters.major}
            onChange={(e) => updateFilter("major", e.target.value)}
            placeholder="Major or department"
            className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          />
          <select
            value={filters.language}
            onChange={(e) => updateFilter("language", e.target.value)}
            className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          >
            <option value="">Language</option>
            <option value="English">English-taught</option>
            <option value="Korean">Korean</option>
          </select>
          <input
            value={filters.rankingMin}
            onChange={(e) => updateFilter("rankingMin", e.target.value)}
            placeholder="QS rank min"
            inputMode="numeric"
            className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          />
          <input
            value={filters.rankingMax}
            onChange={(e) => updateFilter("rankingMax", e.target.value)}
            placeholder="QS rank max"
            inputMode="numeric"
            className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          />
          <input
            value={filters.tuitionMin}
            onChange={(e) => updateFilter("tuitionMin", e.target.value)}
            placeholder="Tuition min"
            inputMode="numeric"
            className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          />
          <input
            value={filters.tuitionMax}
            onChange={(e) => updateFilter("tuitionMax", e.target.value)}
            placeholder="Tuition max"
            inputMode="numeric"
            className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          />
          <select
            value={filters.dormitory}
            onChange={(e) => updateFilter("dormitory", e.target.value)}
            className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          >
            <option value="">Dormitory</option>
            <option value="true">Available</option>
            <option value="false">Not required</option>
          </select>
          <select
            value={filters.type}
            onChange={(e) => updateFilter("type", e.target.value)}
            className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          >
            <option value="">Public / private</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
          <select
            value={filters.deadline}
            onChange={(e) => updateFilter("deadline", e.target.value)}
            className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          >
            <option value="">Deadline status</option>
            <option value="open">Open now</option>
            <option value="soon">Deadline soon</option>
            <option value="closed">Closed</option>
            <option value="upcoming">Upcoming</option>
          </select>
          <select
            value={filters.level}
            onChange={(e) => updateFilter("level", e.target.value)}
            className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          >
            <option value="">Study level</option>
            <option value="undergraduate">Undergraduate</option>
            <option value="graduate">Graduate</option>
          </select>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="submit" className="bg-navy text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-navy-light transition-colors">
            Apply filters
          </button>
          <button type="button" onClick={resetFilters} className="text-sm text-muted hover:text-teal transition-colors">
            Reset
          </button>
          <Link to="/compare" className="text-sm text-muted hover:text-teal transition-colors">
            Compare selected ({compareIds.length})
          </Link>
          <Link to="/dashboard" className="text-sm text-muted hover:text-teal transition-colors">
            My Shortlist ({savedIds.length})
          </Link>
        </div>
        {recentSearches.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {recentSearches.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => updateFilter("search", item)}
                className="text-xs text-muted bg-cream border border-gray-200 rounded-full px-3 py-1"
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </form>

      <motion.div
        key={`${isLoading}-${universityList.length}`}
        aria-busy={isLoading}
        initial={reduceMotion ? false : { opacity: 0.94 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="card-pop grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6"
      >
        {isLoading &&
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-2xl overflow-hidden bg-white shadow-sm animate-pulse">
              <div className="h-44 bg-cream-dark" />
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-cream-dark" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 rounded bg-cream-dark" />
                    <div className="h-3 w-1/3 rounded bg-cream-dark" />
                  </div>
                </div>
                <div className="mt-5 h-3 w-full rounded bg-cream-dark" />
                <div className="mt-3 h-3 w-5/6 rounded bg-cream-dark" />
              </div>
            </div>
          ))}

        {!isLoading && errorMessage && (
          <div className="col-span-full bg-surface rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-navy">University data is not connected yet</h2>
            <p className="mt-2 text-sm text-muted">{errorMessage}</p>
          </div>
        )}

        {!isLoading && !errorMessage && universityList.length === 0 && (
          <div className="col-span-full bg-surface rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-navy">No universities found</h2>
            <p className="mt-2 text-sm text-muted">Try a broader search or reset the filters.</p>
          </div>
        )}

        {!isLoading && !errorMessage && universityList.map((uni) => (
          <UniversityCard
            key={uni.id}
            uni={uni}
            isSaved={savedIds.includes(uni.id)}
            isCompared={compareIds.includes(uni.id)}
            compareDisabled={compareIds.length >= 4}
            onToggleSaved={handleSaved}
            onToggleCompare={handleCompare}
          />
        ))}
      </motion.div>
    </div>
  )
}

export default UniversityList
