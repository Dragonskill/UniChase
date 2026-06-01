const savedKey = "unichase.savedUniversities"
const compareKey = "unichase.compareUniversities"
const deadlineKey = "unichase.deadlines"
const recentSearchKey = "unichase.recentSearches"
const recentlyViewedKey = "unichase.recentlyViewedUniversities"
const tokenKey = "unichase.studentToken"
const userKey = "unichase.studentUser"
const languageKey = "unichase.language"

export const authChangeEvent = "unichase:auth-change"

function notifyAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(authChangeEvent))
  }
}

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

export type RecentlyViewedUniversity = {
  id: number
  name: string
  slug?: string | null
  city?: string | null
  viewedAt: string
}

export function getRecentlyViewedUniversities() {
  return readJson<RecentlyViewedUniversity[]>(recentlyViewedKey, [])
}

export function addRecentlyViewedUniversity(university: Omit<RecentlyViewedUniversity, "viewedAt">) {
  const viewed = {
    ...university,
    viewedAt: new Date().toISOString(),
  }
  const next = [viewed, ...getRecentlyViewedUniversities().filter((item) => item.id !== university.id)].slice(0, 6)
  writeJson(recentlyViewedKey, next)
  return next
}

export function getToken() {
  return localStorage.getItem(tokenKey)
}

export function setToken(token: string) {
  localStorage.setItem(tokenKey, token)
  notifyAuthChange()
}

export function clearToken() {
  localStorage.removeItem(tokenKey)
  localStorage.removeItem(userKey)
  notifyAuthChange()
}

export function getStoredUser<T>() {
  return readJson<T | null>(userKey, null)
}

export function setStoredUser(user: unknown) {
  writeJson(userKey, user)
  notifyAuthChange()
}

export function getStoredLanguage() {
  return localStorage.getItem(languageKey) || "en"
}

export function setStoredLanguage(language: string) {
  localStorage.setItem(languageKey, language)
}
