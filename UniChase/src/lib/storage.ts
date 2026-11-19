const savedKey = "unichase.savedUniversities"
const followedKey = "unichase.followedUniversities"
const compareKey = "unichase.compareUniversities"
const deadlineKey = "unichase.deadlines"
const recentSearchKey = "unichase.recentSearches"
const recentlyViewedKey = "unichase.recentlyViewedUniversities"
const tokenKey = "unichase.studentToken"
const userKey = "unichase.studentUser"
const languageKey = "unichase.language"

export const authChangeEvent = "unichase:auth-change"
export const universityStateChangeEvent = "unichase:university-state-change"

function accountKey(key: string) {
  const user = getStoredUser<{ id: number }>()
  return getToken() && user?.id ? `${key}.user.${user.id}` : key
}

function validIds(value: unknown, limit: number): number[] {
  return Array.isArray(value) ? [...new Set(value.filter((id) => Number.isSafeInteger(id) && id > 0))].slice(0, limit) : []
}

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
  try {
    localStorage.setItem(key, JSON.stringify(value))
    window.dispatchEvent(new Event(universityStateChangeEvent))
  } catch {
    // Storage can be unavailable in private browsing or when the quota is full.
  }
}

export function getSavedUniversityIds() {
  return validIds(readJson(accountKey(savedKey), []), 100)
}

export function setSavedUniversityIds(ids: number[]) {
  writeJson(accountKey(savedKey), validIds(ids, 100))
}

export function getFollowedUniversityIds() {
  return validIds(readJson(accountKey(followedKey), []), 100)
}

export function setFollowedUniversityIds(ids: number[]) {
  writeJson(accountKey(followedKey), validIds(ids, 100))
}

export function toggleSavedUniversity(id: number) {
  const ids = getSavedUniversityIds()
  const next = ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]
  setSavedUniversityIds(next)
  return next
}

export function getCompareUniversityIds() {
  return validIds(readJson(compareKey, []), 4)
}

export function setCompareUniversityIds(ids: number[]) {
  writeJson(compareKey, validIds(ids, 4))
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
  const items = readJson<LocalDeadline[]>(accountKey(deadlineKey), [])
  return Array.isArray(items) ? items : []
}

export function saveLocalDeadline(deadline: LocalDeadline) {
  const existing = getLocalDeadlines().filter(
    (item) => !(item.universityId === deadline.universityId && item.deadlineType === deadline.deadlineType),
  )
  writeJson(accountKey(deadlineKey), [...existing, deadline])
}

export function getRecentSearches() {
  const items = readJson<string[]>(recentSearchKey, [])
  return Array.isArray(items) ? items.filter((item) => typeof item === "string").slice(0, 5) : []
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
  const items = readJson<RecentlyViewedUniversity[]>(recentlyViewedKey, [])
  return Array.isArray(items) ? items.filter((item) => item && Number.isSafeInteger(item.id)).slice(0, 6) : []
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
  try {
    const token = localStorage.getItem(tokenKey)
    return token?.startsWith("local-") ? null : token
  } catch { return null }
}

export function setToken(token: string) {
  try { localStorage.setItem(tokenKey, token) } catch { return }
  notifyAuthChange()
}

export function clearToken() {
  try {
    localStorage.removeItem(tokenKey)
    localStorage.removeItem(userKey)
  } catch { /* The in-memory UI still receives the logout event. */ }
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
  try { return localStorage.getItem(languageKey) || "en" } catch { return "en" }
}

export function setStoredLanguage(language: string) {
  try { localStorage.setItem(languageKey, language) } catch { /* Keep this session usable. */ }
}
