import type { University } from "@/data/universities"

export function normalizeSearch(value?: string | null) { return (value || "").normalize("NFKC").toLocaleLowerCase().trim() }

function oneEditAway(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return false
  let left = 0, right = 0, edits = 0
  while (left < a.length && right < b.length) {
    if (a[left] === b[right]) { left++; right++; continue }
    if (++edits > 1) return false
    if (a.length >= b.length) left++
    if (b.length >= a.length) right++
  }
  return edits + (a.length - left) + (b.length - right) <= 1
}

export function universitySearchScore(university: University, query: string) {
  const tokens = normalizeSearch(query).split(/\s+/).filter(Boolean)
  if (!tokens.length) return 0
  const name = normalizeSearch(`${university.name} ${university.koreanName || ""}`)
  const text = normalizeSearch([university.name, university.koreanName, university.city, university.location, university.description, university.qsRanking, ...(university.programs || []), ...(university.languageOfInstruction || []), university.studentCouncil?.name, ...(university.studentCouncil?.roles || []).flatMap((role) => [role.roleTitle, role.department, role.description])].filter(Boolean).join(" "))
  const words = text.split(/[^\p{L}\p{N}]+/u)
  let score = 0
  for (const token of tokens) {
    if (name.includes(token)) score += 4
    else if (text.includes(token)) score += 2
    else if (token.length >= 4 && words.some((word) => oneEditAway(word, token))) score += 1
    else return -1
  }
  return score
}
