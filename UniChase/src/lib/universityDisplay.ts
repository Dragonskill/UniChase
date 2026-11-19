import type { University } from "@/data/universities"

export function verificationLabel(status?: string | null) {
  if (status === "verified") return "Verified"
  if (status === "manually added") return "Manually added"
  if (status === "outdated") return "Outdated"
  return "Needs verification"
}

export function universityVerification(university: University) {
  return verificationLabel((university as University & { verificationStatus?: string }).verificationStatus)
}

export function formatUniversityDate(value?: string | null) {
  if (!value || Number.isNaN(Date.parse(value))) return "Not announced"
  return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(value))
}

export function formatTuition(university: University) {
  const { min, max, currency = "KRW" } = university.tuition || {}
  if (min == null && max == null) return "Not verified"
  if (min == null) return `Up to ${max!.toLocaleString()} ${currency}`
  if (max == null) return `From ${min.toLocaleString()} ${currency}`
  return `${min.toLocaleString()} – ${max.toLocaleString()} ${currency}`
}
