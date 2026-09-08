import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Link, useSearchParams } from "react-router-dom"
import { universities as fallbackUniversities, type University } from "@/data/universities"
import UniversityCard from "@/components/ui/UniversityCard"
import { fetchUniversityPage } from "@/lib/api"
import {
  addRecentSearch,
  getRecentlyViewedUniversities,

  getRecentSearches,




} from "@/lib/storage"
import { applySeo } from "@/lib/seo"
import { useUniversityState } from "@/lib/universityState"
import { universitySearchScore } from "@/lib/universitySearch"

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
  sort: string
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
  sort: "qsRank",
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

function sortedFallbackItems(items: University[], sort: string) {
  return [...items].sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name)
    if (sort === "city") return (a.city || a.location).localeCompare(b.city || b.location) || a.name.localeCompare(b.name)
    if (sort === "tuition") return (a.tuition?.min ?? Number.MAX_SAFE_INTEGER) - (b.tuition?.min ?? Number.MAX_SAFE_INTEGER)
    if (sort === "recent") return (new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()) || b.id - a.id
    return (rankingNumber(a) ?? Number.MAX_SAFE_INTEGER) - (rankingNumber(b) ?? Number.MAX_SAFE_INTEGER)
  })
}

function applyFallbackFilters(items: University[], filters: FilterState) {
  const search = normalized(filters.search)

  const filtered = items.filter((university) => {
    const rank = rankingNumber(university)
    const tuitionMin = university.tuition?.min ?? null
    const tuitionMax = university.tuition?.max ?? null
    if (search && universitySearchScore(university, search) < 0) return false
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

  return sortedFallbackItems(filtered, filters.sort)
}

function UniversityList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState<FilterState>(() => ({
    ...initialFilters,
    search: searchParams.get("search") || "",
  }))
  const [page, setPage] = useState(1)
  const [urlSearch, setUrlSearch] = useState(searchParams.get("search") || "")
  if (urlSearch !== (searchParams.get("search") || "")) {
    setUrlSearch(searchParams.get("search") || "")
    setFilters((current) => ({ ...current, search: searchParams.get("search") || "" }))
    setPage(1)
  }
  const [total, setTotal] = useState(0)
  const [universityList, setUniversityList] = useState<University[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const { savedIds, followedIds, compareIds, toggleSaved: handleSaved, toggleFollowed: handleFollowed, toggleCompare: handleCompare, message: stateMessage, pending } = useUniversityState()
  const [recentSearches, setRecentSearches] = useState<string[]>(() => getRecentSearches())
  const [recentlyViewed, setRecentlyViewed] = useState(() => getRecentlyViewedUniversities())
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const showBackToTopRef = useRef(false)
  const reduceMotion = useReducedMotion()

  const queryFilters = useMemo(
    () => ({
      page,
      limit: 12,
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
      sort: filters.sort,
    }),
    [filters, page],
  )

  useEffect(() => {
    applySeo({
      title: "Korean Universities | UniChase",
      description: "Search, filter, save, and compare Korean universities for international study.",
      canonicalPath: "/university",
    })
  }, [])

  useEffect(() => {
    let frame = 0

    const updateBackToTop = () => {
      frame = 0
      const next = window.scrollY > 520
      if (showBackToTopRef.current !== next) {
        showBackToTopRef.current = next
        setShowBackToTop(next)
      }
    }

    const onScroll = () => {
      if (frame === 0) {
        frame = window.requestAnimationFrame(updateBackToTop)
      }
    }

    updateBackToTop()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (frame) {
        window.cancelAnimationFrame(frame)
      }
    }
  }, [])

  useEffect(() => {
    const syncRecentlyViewed = () => setRecentlyViewed(getRecentlyViewedUniversities())
    window.addEventListener("storage", syncRecentlyViewed)
    return () => window.removeEventListener("storage", syncRecentlyViewed)
  }, [])

  useEffect(() => {
    let ignore = false

    const timeout = window.setTimeout(() => {
      setIsLoading(true)
      fetchUniversityPage(queryFilters)
        .then(({ data: items, meta }) => {
          if (!ignore) {
            setUniversityList(items)
            setTotal(meta.total)
            setErrorMessage("")
          }
        })
        .catch(() => {
          if (!ignore) {
            const fallbackItems = applyFallbackFilters(fallbackUniversities, queryFilters)
            setUniversityList(fallbackItems.slice((page - 1) * 12, page * 12))
            setTotal(fallbackItems.length)
            setErrorMessage("Showing the saved directory. Live updates are temporarily unavailable.")
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
  }, [queryFilters, page])

  const updateFilter = (key: keyof FilterState, value: string) => {
    setPage(1)
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
    setPage(1)
    setFilters(initialFilters)
    setSearchParams({})
  }

  return (
    <div className="page-fade max-w-6xl mx-auto px-6 py-8">
      <h1 className="sr-only">South Korean universities</h1>
      <div className="mb-4 flex items-center gap-2 text-sm text-muted">
        <Link to="/" className="hover:text-teal">Home</Link>
        <span>/</span>
        <span className="text-ink">Universities</span>
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Showing {isLoading ? "..." : total} universities</p>
        <button
          type="button"
          onClick={() => setFiltersOpen((current) => !current)}
          className="sm:hidden rounded-full border border-gray-200 bg-surface px-4 py-2 text-sm font-medium text-muted"
          aria-expanded={filtersOpen}
        >
          {filtersOpen ? "Hide filters" : "Show filters"}
        </button>
      </div>
      <datalist id="university-suggestions">{fallbackUniversities.filter((uni) => filters.search.length > 1 && universitySearchScore(uni, filters.search) >= 0).slice(0, 6).map((uni) => <option key={uni.id} value={uni.name} />)}</datalist><form onSubmit={submitFilters} className="mb-6 bg-surface rounded-2xl shadow-sm p-4">
        <div className={`${filtersOpen ? "grid" : "hidden"} grid-cols-1 sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3`}>
          <input
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            aria-label="Search universities, majors, city" list="university-suggestions" placeholder="Search universities, majors, city"
            className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          />
          <input
            value={filters.city}
            onChange={(e) => updateFilter("city", e.target.value)}
            aria-label="City" placeholder="City"
            className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          />
          <input
            value={filters.major}
            onChange={(e) => updateFilter("major", e.target.value)}
            aria-label="Major or department" placeholder="Major or department"
            className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          />
          <select aria-label="language filter" value={filters.language}
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
            aria-label="QS rank min" placeholder="QS rank min"
            inputMode="numeric"
            className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          />
          <input
            value={filters.rankingMax}
            onChange={(e) => updateFilter("rankingMax", e.target.value)}
            aria-label="QS rank max" placeholder="QS rank max"
            inputMode="numeric"
            className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          />
          <input
            value={filters.tuitionMin}
            onChange={(e) => updateFilter("tuitionMin", e.target.value)}
            aria-label="Tuition min" placeholder="Tuition min"
            inputMode="numeric"
            className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          />
          <input
            value={filters.tuitionMax}
            onChange={(e) => updateFilter("tuitionMax", e.target.value)}
            aria-label="Tuition max" placeholder="Tuition max"
            inputMode="numeric"
            className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          />
          <select aria-label="dormitory filter" value={filters.dormitory}
            onChange={(e) => updateFilter("dormitory", e.target.value)}
            className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          >
            <option value="">Dormitory</option>
            <option value="true">Available</option>
            <option value="false">Unavailable</option>
          </select>
          <select aria-label="type filter" value={filters.type}
            onChange={(e) => updateFilter("type", e.target.value)}
            className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          >
            <option value="">Public / private</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
          <select aria-label="deadline filter" value={filters.deadline}
            onChange={(e) => updateFilter("deadline", e.target.value)}
            className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          >
            <option value="">Deadline status</option>
            <option value="open">Open now</option>
            <option value="soon">Deadline soon</option>
            <option value="closed">Closed</option>
            <option value="upcoming">Upcoming</option>
          </select>
          <select aria-label="level filter" value={filters.level}
            onChange={(e) => updateFilter("level", e.target.value)}
            className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          >
            <option value="">Study level</option>
            <option value="undergraduate">Undergraduate</option>
            <option value="graduate">Graduate</option>
          </select>
          <select aria-label="sort filter" value={filters.sort}
            onChange={(e) => updateFilter("sort", e.target.value)}
            className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          >
            <option value="qsRank">Sort: QS ranking</option>
            <option value="name">Sort: Name</option>
            <option value="city">Sort: City</option>
            <option value="tuition">Sort: Tuition</option>
            <option value="recent">Sort: Recently added</option>
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
        {recentlyViewed.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-muted px-1 py-1">Recently viewed</span>
            {recentlyViewed.map((item) => (
              <Link key={item.id} to={`/universities/${item.slug || item.id}`} className="text-xs text-muted bg-cream border border-gray-200 rounded-full px-3 py-1 hover:text-teal">
                {item.name}
              </Link>
            ))}
          </div>
        )}
      </form>

      {stateMessage && <p role="status" className="mb-4 text-sm text-muted">{stateMessage}</p>}<motion.div
        key={`${isLoading}-${universityList.length}`}
        aria-busy={isLoading}
        initial={reduceMotion ? false : { opacity: 0.94 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="card-pop university-card-grid"
      >
        {isLoading &&
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="university-card-shell bg-white shadow-sm animate-pulse">
              <div className="university-card-media bg-cream-dark" />
              <div className="flex min-h-0 flex-1 flex-col p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-cream-dark" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 rounded bg-cream-dark" />
                    <div className="h-3 w-1/3 rounded bg-cream-dark" />
                  </div>
                </div>
                <div className="mt-5 h-3 w-full rounded bg-cream-dark" />
                <div className="mt-3 h-3 w-5/6 rounded bg-cream-dark" />
                <div className="mt-auto h-4 w-24 rounded bg-cream-dark" />
              </div>
            </div>
          ))}

        {!isLoading && errorMessage && (
          <div className="col-span-full bg-surface rounded-2xl shadow-sm p-6">
            <p className="mt-2 text-sm text-muted">{errorMessage}</p>
          </div>
        )}

        {!isLoading && universityList.length === 0 && (
          <div className="col-span-full bg-surface rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-navy">No universities found</h2>
            <p className="mt-2 text-sm text-muted">Try a broader search or reset the filters.</p>
          </div>
        )}

        {!isLoading && universityList.map((uni, index) => (
          <div
            key={uni.id}
            className="university-card-entry min-w-0"
            style={{ "--card-index": Math.min(index, 8) } as CSSProperties}
          >
            <UniversityCard
              uni={uni}
              isSaved={savedIds.includes(uni.id)}
              isFollowed={followedIds.includes(uni.id)}
              savePending={pending.includes('saved-' + uni.id)}
              followPending={pending.includes('followed-' + uni.id)}
              onToggleFollowed={handleFollowed}
              isCompared={compareIds.includes(uni.id)}
              compareDisabled={compareIds.length >= 4}
              onToggleSaved={handleSaved}
              onToggleCompare={handleCompare}
            />
          </div>
        ))}
      </motion.div>
      {total > 12 && <nav aria-label="University result pages" className="mt-6 flex items-center justify-center gap-4"><button type="button" disabled={page <= 1 || isLoading} onClick={() => setPage(page - 1)} className="rounded-full border border-gray-200 px-4 py-2 text-sm disabled:opacity-40">Previous</button><span className="text-sm text-muted">Page {page} of {Math.ceil(total / 12)}</span><button type="button" disabled={page >= Math.ceil(total / 12) || isLoading} onClick={() => setPage(page + 1)} className="rounded-full border border-gray-200 px-4 py-2 text-sm disabled:opacity-40">Next</button></nav>}{showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" })}
          className="fixed bottom-5 right-5 z-40 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-navy-light focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
        >
          Back to top
        </button>
      )}
    </div>
  )
}

export default UniversityList
