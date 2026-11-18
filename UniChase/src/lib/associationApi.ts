import { apiFetch, apiFetchWithAuth, getApiBaseUrl } from './api'

export type Verification = 'verified' | 'needs verification' | 'manually added'
export type ContentType = 'EVENT' | 'POST' | 'INTERVIEW'
export type SocialLinks = { telegramUrl: string | null; instagramUrl: string | null; linkedinUrl: string | null }

type Profile = SocialLinks & {
  name: string
  officialName: string | null
  description: string
  associationEnabled: boolean
  logoUrl: string | null
  imageId: string | null
  foundedYear: number | null
  memberCount: number | null
  verificationStatus: Verification
}

export type Member = SocialLinks & {
  id: number
  displayName: string | null
  roleTitle: string
  roleShort: string | null
  major: string | null
  academicYear: string | null
  avatarUrl: string | null
  imageId: string | null
  status: 'active' | 'inactive' | 'pending'
  verificationStatus: Verification
  displayOrder: number
}

export type Advisor = {
  id: number
  name: string
  major: string
  academicYear: string | null
  photoUrl: string | null
  imageId: string | null
  contactUrl: string | null
  active: boolean
  displayOrder: number
  verificationStatus: Verification
}

export type FeedItem = {
  id: number
  type: ContentType
  title: string
  description: string
  body: string | null
  imageUrl: string | null
  imageId: string | null
  date: string
  externalUrl: string | null
  published: boolean
}

export type Association = Profile & {
  id: number
  universityId: number
  university: { name: string }
  roles: Member[]
  advisors: Advisor[]
  content: FeedItem[]
}

export type AdvisorQuestion = {
  id: number
  advisorName: string
  advisorMajor: string
  associationName: string
  universityName: string
  student: { name: string; email: string } | null
  body: string
  createdAt: string
}

export type Collection = 'members' | 'advisors' | 'content'
const moderator = '/moderator/associations'

export function safeExternalUrl(value?: string | null) {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : undefined
  } catch {
    return undefined
  }
}

export function associationImage(imageId: string | null, url?: string | null) {
  return imageId ? getApiBaseUrl() + '/associations/images/' + encodeURIComponent(imageId) : safeExternalUrl(url)
}

export async function fetchAssociation(university: string, signal: AbortSignal) {
  const result = await apiFetch<{ data: Association | null }>('/associations/universities/' + encodeURIComponent(university), { signal })
  return result.data
}

export function submitAdvisorQuestion(token: string, councilId: number, advisorId: number, body: string) {
  return apiFetchWithAuth<{ data: { id: number } }>(`/associations/${councilId}/advisors/${advisorId}/questions`, {
    token, method: 'POST', body: JSON.stringify({ body }),
  })
}

export function loadManagedAssociation(token: string, universityId: number) {
  return apiFetchWithAuth<{ data: Association | null }>(`${moderator}/universities/${universityId}`, { token })
}

export function saveManagedAssociation(token: string, universityId: number, profile: Profile) {
  return apiFetchWithAuth<{ data: Association }>(`${moderator}/universities/${universityId}`, {
    token, method: 'PUT', body: JSON.stringify(profile),
  })
}

export function saveAssociationRecord(token: string, id: number, kind: Collection, record: Partial<Member | Advisor | FeedItem>) {
  const { id: recordId, ...data } = record
  return apiFetchWithAuth<{ data: Member | Advisor | FeedItem }>(`${moderator}/${id}/${kind}${recordId ? '/' + recordId : ''}`, {
    token, method: recordId ? 'PUT' : 'POST', body: JSON.stringify(data),
  })
}

export function removeAssociationRecord(token: string, id: number, kind: Collection, recordId: number) {
  return apiFetchWithAuth(`${moderator}/${id}/${kind}/${recordId}`, { token, method: 'DELETE' })
}

export async function uploadAssociationImage(token: string, file: File) {
  const result = await apiFetchWithAuth<{ data: { id: string } }>(moderator + '/images', {
    token, method: 'POST', headers: { 'Content-Type': file.type }, body: file,
  })
  return result.data.id
}

export function loadAdvisorQuestions(token: string, status: 'open' | 'handled', before?: number) {
  return apiFetchWithAuth<{ data: AdvisorQuestion[]; next: number | null }>(
    moderator + '/questions?status=' + status + (before ? '&before=' + before : ''), { token },
  )
}

export function updateAdvisorQuestion(token: string, id: number, handled: boolean) {
  return apiFetchWithAuth(moderator + '/questions/' + id, {
    token, method: 'PATCH', body: JSON.stringify({ handled }),
  })
}
