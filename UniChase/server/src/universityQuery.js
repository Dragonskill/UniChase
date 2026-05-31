import { ApiError } from "./errors.js"

export function parsePositiveId(value) {
  const id = Number(value)

  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, "Invalid university id")
  }

  return id
}

export function buildUniversityWhere(filters = {}) {
  const and = []
  const minRanking = filters.rankingMin
  const maxRanking = filters.rankingMax || filters.maxRanking || filters.ranking
  const minTuition = filters.tuitionMin
  const maxTuition = filters.tuitionMax || filters.maxTuition || filters.tuition
  const hasScholarships =
    filters.hasScholarships === undefined ? filters.scholarship : filters.hasScholarships

  if (filters.city) {
    and.push({ city: { contains: filters.city, mode: "insensitive" } })
  }

  if (minRanking || maxRanking) {
    and.push({
      qsRanking: {
        ...(minRanking ? { gte: minRanking } : {}),
        ...(maxRanking ? { lte: maxRanking } : {}),
      },
    })
  }

  if (minTuition || maxTuition) {
    if (maxTuition) {
      and.push({
        OR: [{ tuitionMin: { lte: maxTuition } }, { tuitionMax: { lte: maxTuition } }],
      })
    }

    if (minTuition) {
      and.push({
        OR: [{ tuitionMax: { gte: minTuition } }, { tuitionMin: { gte: minTuition } }],
      })
    }
  }

  if (filters.language || filters.english) {
    and.push({ languagesOfInstruction: { has: filters.language || "English" } })
  }

  if (filters.dormitory !== undefined) {
    and.push({ hasDormitory: filters.dormitory })
  }

  if (filters.type) {
    and.push({ universityType: filters.type })
  }

  if (filters.level) {
    and.push({ studyLevels: { has: filters.level } })
  }

  if (hasScholarships !== undefined) {
    and.push({ hasScholarships })
  }

  if (filters.deadline) {
    const now = new Date()
    const soon = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000)

    if (filters.deadline === "open") {
      and.push({ applicationOpenDate: { lte: now } })
      and.push({ applicationDeadline: { gte: now } })
    }

    if (filters.deadline === "soon") {
      and.push({ applicationDeadline: { gte: now, lte: soon } })
    }

    if (filters.deadline === "closed") {
      and.push({ applicationDeadline: { lt: now } })
    }

    if (filters.deadline === "upcoming") {
      and.push({ applicationOpenDate: { gt: now } })
    }
  }

  return and.length > 0 ? { AND: and } : {}
}

function normalize(value) {
  return String(value || "").toLowerCase()
}

function includesText(value, query) {
  return normalize(value).includes(normalize(query))
}

function arrayIncludes(values, query) {
  return (values || []).some((value) => includesText(value, query))
}

function matchesSearch(university, rawSearch) {
  if (!rawSearch) {
    return true
  }

  const tokens = rawSearch
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)

  return tokens.every((token) =>
    [
      university.name,
      university.koreanName,
      university.city,
      university.country,
      university.description,
      university.rankingSourceNote,
    ].some((value) => includesText(value, token)) ||
      arrayIncludes(university.programs, token) ||
      arrayIncludes(university.tags, token) ||
      arrayIncludes(university.languagesOfInstruction, token) ||
      arrayIncludes(university.studyLevels, token),
  )
}

export function filterUniversitiesInMemory(universities, filters = {}) {
  const search = filters.search || filters.q || filters.name

  return universities.filter((university) => {
    if (!matchesSearch(university, search)) {
      return false
    }

    if (filters.major && !arrayIncludes(university.programs, filters.major)) {
      return false
    }

    return true
  })
}
