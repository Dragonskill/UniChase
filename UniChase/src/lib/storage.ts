const savedKey = "unichase.savedUniversities"
const compareKey = "unichase.compareUniversities"
const deadlineKey = "unichase.deadlines"
const recentSearchKey = "unichase.recentSearches"
const tokenKey = "unichase.studentToken"
const userKey = "unichase.studentUser"
const languageKey = "unichase.language"

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getSavedUniversityIds() {
  return readJson<number[]>(savedKey, [])
}

export function setSavedUniversityIds(ids: number[]) {
  writeJson(savedKey, [...new Set(ids)].slice(0, 100))
}

export function toggleSavedUniversity(id: number) {
  const ids = getSavedUniversityIds()
  const next = ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]
  setSavedUniversityIds(next)
  return next
}

export function getCompareUniversityIds() {
  return readJson<number[]>(compareKey, [])
}

export function setCompareUniversityIds(ids: number[]) {
  writeJson(compareKey, [...new Set(ids)].slice(0, 4))
}

export function toggleCompareUniversity(id: number) {
  const ids = getCompareUniversityIds()
  const next = ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id].slice(0, 4)
  setCompareUniversityIds(next)
  return next
}

export type LocalDeadline = {
  universityId: number
  deadlineType: "application" | "scholarship" | "document"
  important: boolean
}

export function getLocalDeadlines() {
  return readJson<LocalDeadline[]>(deadlineKey, [])
}

export function saveLocalDeadline(deadline: LocalDeadline) {
  const existing = getLocalDeadlines().filter(
    (item) => !(item.universityId === deadline.universityId && item.deadlineType === deadline.deadlineType),
  )
  writeJson(deadlineKey, [...existing, deadline])
}

export function getRecentSearches() {
  return readJson<string[]>(recentSearchKey, [])
}

export function addRecentSearch(query: string) {
  const trimmed = query.trim()

  if (!trimmed) {
    return
  }

  writeJson(recentSearchKey, [trimmed, ...getRecentSearches().filter((item) => item !== trimmed)].slice(0, 5))
}

export function getToken() {
  return localStorage.getItem(tokenKey)
}

export function setToken(token: string) {
  localStorage.setItem(tokenKey, token)
}

export function clearToken() {
  localStorage.removeItem(tokenKey)
  localStorage.removeItem(userKey)
}

export function getStoredUser<T>() {
  return readJson<T | null>(userKey, null)
}

export function setStoredUser(user: unknown) {
  writeJson(userKey, user)
}

export function getStoredLanguage() {
  return localStorage.getItem(languageKey) || "en"
}

export function setStoredLanguage(language: string) {
  localStorage.setItem(languageKey, language)
}
