import type { StudentCouncil, StudentCouncilRole, University } from "@/data/universities"

type UniversityListResponse = {
  data: University[]
}

type UniversityDetailResponse = {
  data: University
}

type StudentCouncilListResponse = {
  data: StudentCouncil[]
}

type StudentCouncilResponse = {
  data: StudentCouncil
}

type StudentCouncilRoleResponse = {
  data: StudentCouncilRole
}

const fallbackApiBaseUrl = "http://localhost:3001/api"
const requestTimeoutMs = 8000

function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL || fallbackApiBaseUrl).replace(/\/$/, "")
}

export function getApiUrl(path: string) {
  return `${getApiBaseUrl()}${path}`
}

export class ApiRequestError extends Error {
  status?: number
  details?: unknown
  isNetworkError: boolean

  constructor(
    message: string,
    options: { status?: number; details?: unknown; isNetworkError?: boolean } = {},
  ) {
    super(message)
    this.name = "ApiRequestError"
    this.status = options.status
    this.details = options.details
    this.isNetworkError = Boolean(options.isNetworkError)
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  const controller = new AbortController()
  const timeout = globalThis.setTimeout(() => controller.abort(), requestTimeoutMs)

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  let response: Response

  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    })
  } catch {
    throw new ApiRequestError("Could not connect to the UniChase API.", { isNetworkError: true })
  } finally {
    globalThis.clearTimeout(timeout)
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new ApiRequestError(body?.error?.message || `API request failed with status ${response.status}`, {
      status: response.status,
      details: body?.error?.details,
    })
  }

  return response.json() as Promise<T>
}

type ApiOptions = RequestInit & {
  token?: string | null
}

async function apiFetchWithAuth<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers)

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`)
  }

  return apiFetch<T>(path, { ...options, headers })
}

export async function fetchUniversities() {
  const response = await apiFetch<UniversityListResponse>("/universities")
  return response.data
}

export async function fetchFilteredUniversities(filters: Record<string, string | number | boolean | undefined>) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value))
    }
  })

  const query = params.toString()
  const response = await apiFetch<UniversityListResponse>(`/universities${query ? `?${query}` : ""}`)
  return response.data
}

export async function fetchUniversity(idOrSlug: number | string) {
  const response = await apiFetch<UniversityDetailResponse>(`/universities/${idOrSlug}`)
  return response.data
}

export async function fetchStudentCouncil(idOrSlug: number | string) {
  const response = await apiFetch<StudentCouncilResponse>(`/universities/${idOrSlug}/student-council`)
  return response.data
}

export async function fetchStudentCouncils() {
  const response = await apiFetch<StudentCouncilListResponse>("/student-councils")
  return response.data
}

export async function fetchComparedUniversities(ids: number[]) {
  const response = await apiFetch<UniversityListResponse>(`/universities/compare?ids=${ids.join(",")}`)
  return response.data
}

export type RecommendationInput = {
  preferredMajor?: string
  tuitionMin?: number
  tuitionMax?: number
  preferredCity?: string
  language?: string
  englishRequired?: boolean
  dormitoryRequired?: boolean
  rankingMin?: number
  rankingMax?: number
  level?: string
  scholarshipPreferred?: boolean
}

export type Recommendation = {
  university: University
  score: number
  reasons: string[]
}

export async function fetchRecommendations(input: RecommendationInput) {
  const response = await apiFetch<{ data: Recommendation[] }>("/universities/recommendations", {
    method: "POST",
    body: JSON.stringify(input),
  })
  return response.data
}

export type StudentUser = {
  id: number
  name: string
  email: string
  preferredMajor?: string | null
  preferredCity?: string | null
  preferredLevel?: string | null
  budgetMin?: number | null
  budgetMax?: number | null
}

export async function registerStudent(data: { name: string; email: string; password: string }) {
  return apiFetchWithAuth<{ data: { token: string; user: StudentUser } }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function loginStudent(data: { email: string; password: string }) {
  return apiFetchWithAuth<{ data: { token: string; user: StudentUser } }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function fetchProfile(token: string) {
  const response = await apiFetchWithAuth<{ data: StudentUser }>("/user/profile", { token })
  return response.data
}

export async function updateProfile(token: string, data: Partial<StudentUser>) {
  const response = await apiFetchWithAuth<{ data: StudentUser }>("/user/profile", {
    token,
    method: "PATCH",
    body: JSON.stringify(data),
  })
  return response.data
}

export async function fetchSavedUniversities(token: string) {
  const response = await apiFetchWithAuth<{ data: { university: University }[] }>("/user/saved-universities", {
    token,
  })
  return response.data.map((item) => item.university)
}

export async function saveUniversityToAccount(token: string, universityId: number) {
  return apiFetchWithAuth("/user/saved-universities", {
    token,
    method: "POST",
    body: JSON.stringify({ universityId }),
  })
}

export async function removeUniversityFromAccount(token: string, universityId: number) {
  return apiFetchWithAuth(`/user/saved-universities/${universityId}`, {
    token,
    method: "DELETE",
  })
}

export async function fetchChecklist(token: string) {
  const response = await apiFetchWithAuth<{ data: { id: number; title: string; completed: boolean }[] }>(
    "/user/checklist",
    { token },
  )
  return response.data
}

export async function updateChecklist(
  token: string,
  items: { title: string; completed: boolean; dueDate?: string | null }[],
) {
  const response = await apiFetchWithAuth<{ data: { id: number; title: string; completed: boolean }[] }>(
    "/user/checklist",
    {
      token,
      method: "PATCH",
      body: JSON.stringify({ items }),
    },
  )
  return response.data
}

export async function saveDeadlineToAccount(
  token: string,
  data: { universityId: number; deadlineType: string; important: boolean; note?: string },
) {
  return apiFetchWithAuth("/user/deadlines", {
    token,
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function fetchAccountDeadlines(token: string) {
  const response = await apiFetchWithAuth<{
    data: { id: number; deadlineType: string; important: boolean; university: University }[]
  }>("/user/deadlines", { token })
  return response.data
}

export async function submitContact(data: {
  name: string
  email: string
  universityOfInterest?: string
  subject: string
  message: string
}) {
  return apiFetchWithAuth("/contact", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export type CommunityPost = {
  id: number
  title: string
  content: string
  category: string
  universityId?: number | null
  university?: { id: number; name: string; slug?: string | null; city?: string | null } | null
  relatedProgram?: string | null
  tags: string[]
  author?: { id: number; name: string } | null
  authorId: number
  status: string
  pinned: boolean
  officialAnswer?: string | null
  officialCommentId?: number | null
  likes: number
  comments: number
  liked?: boolean
  saved?: boolean
  createdAt: string
  updatedAt: string
}

export type CommunityComment = {
  id: number
  postId: number
  authorId: number
  author?: { id: number; name: string } | null
  content: string
  parentCommentId?: number | null
  status: string
  official: boolean
  createdAt: string
  updatedAt: string
}

export async function fetchCommunityCategories() {
  const response = await apiFetch<{ data: string[] }>("/community/categories")
  return response.data
}

export async function fetchCommunityPosts(filters: Record<string, string | number | undefined> = {}, token?: string | null) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value))
  })
  const response = await apiFetchWithAuth<{ data: CommunityPost[]; meta: { total: number; page: number; limit: number } }>(
    `/community/posts${params.toString() ? `?${params.toString()}` : ""}`,
    { token },
  )
  return response
}

export async function fetchCommunityPost(id: number | string, token?: string | null) {
  const response = await apiFetchWithAuth<{ data: CommunityPost & { comments: CommunityComment[] } }>(`/community/posts/${id}`, { token })
  return response.data
}

export async function createCommunityPost(token: string, data: {
  title: string
  content: string
  category: string
  universityId?: number | null
  relatedProgram?: string | null
  tags?: string[]
}) {
  const response = await apiFetchWithAuth<{ data: CommunityPost }>("/community/posts", {
    token,
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.data
}

export async function updateCommunityPost(token: string, id: number, data: Partial<CommunityPost>) {
  const response = await apiFetchWithAuth<{ data: CommunityPost }>(`/community/posts/${id}`, {
    token,
    method: "PATCH",
    body: JSON.stringify(data),
  })
  return response.data
}

export async function deleteCommunityPost(token: string, id: number) {
  return apiFetchWithAuth(`/community/posts/${id}`, { token, method: "DELETE" })
}

export async function createCommunityComment(token: string, postId: number, data: { content: string; parentCommentId?: number | null }) {
  const response = await apiFetchWithAuth<{ data: CommunityComment }>(`/community/posts/${postId}/comments`, {
    token,
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.data
}

export async function toggleCommunityPostLike(token: string, id: number) {
  const response = await apiFetchWithAuth<{ data: { liked: boolean; likes: number } }>(`/community/posts/${id}/like`, {
    token,
    method: "POST",
  })
  return response.data
}

export async function toggleCommunityPostSave(token: string, id: number) {
  const response = await apiFetchWithAuth<{ data: { saved: boolean } }>(`/community/posts/${id}/save`, {
    token,
    method: "POST",
  })
  return response.data
}

export async function reportCommunityPost(token: string, id: number, data: { reason: string; details?: string; commentId?: number | null }) {
  return apiFetchWithAuth(`/community/posts/${id}/report`, {
    token,
    method: "POST",
    body: JSON.stringify(data),
  })
}

export type NotificationItem = {
  id: number
  type: string
  title: string
  message: string
  relatedEntityType?: string | null
  relatedEntityId?: number | null
  linkUrl?: string | null
  isRead: boolean
  priority: "low" | "normal" | "high" | "urgent"
  createdAt: string
}

export async function fetchNotifications(token: string, filters: { unread?: boolean; type?: string } = {}) {
  const params = new URLSearchParams()
  if (filters.unread) params.set("unread", "true")
  if (filters.type) params.set("type", filters.type)
  const response = await apiFetchWithAuth<{ data: NotificationItem[] }>(
    `/notifications${params.toString() ? `?${params.toString()}` : ""}`,
    { token },
  )
  return response.data
}

export async function fetchUnreadNotificationCount(token: string) {
  const response = await apiFetchWithAuth<{ data: { count: number } }>("/notifications/unread-count", { token })
  return response.data.count
}

export async function markNotificationRead(token: string, id: number) {
  return apiFetchWithAuth(`/notifications/${id}/read`, { token, method: "PATCH" })
}

export async function markAllNotificationsRead(token: string) {
  return apiFetchWithAuth("/notifications/read-all", { token, method: "PATCH" })
}

export async function deleteNotification(token: string, id: number) {
  return apiFetchWithAuth(`/notifications/${id}`, { token, method: "DELETE" })
}

export type OnboardingPreference = {
  desiredMajor?: string | null
  degreeLevel?: string | null
  preferredCity?: string | null
  languagePreference?: string | null
  budgetMin?: number | null
  budgetMax?: number | null
  qsRankMin?: number | null
  qsRankMax?: number | null
  dormitoryRequired?: boolean | null
  scholarshipPreference?: string | null
  targetIntake?: string | null
  educationLevel?: string | null
  preparationStage?: string | null
  nationality?: string | null
  testStatus?: string | null
  onboardingCompleted?: boolean
}

export async function fetchOnboarding(token: string) {
  const response = await apiFetchWithAuth<{ data: OnboardingPreference | null }>("/user/onboarding", { token })
  return response.data
}

export async function saveOnboarding(token: string, data: OnboardingPreference) {
  const response = await apiFetchWithAuth<{ data: OnboardingPreference }>("/user/onboarding", {
    token,
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.data
}

export async function generateDashboardFromOnboarding(token: string) {
  const response = await apiFetchWithAuth<{ data: { recommendedUniversities: University[]; checklistCreated: boolean } }>(
    "/user/onboarding/generate-dashboard",
    { token, method: "POST" },
  )
  return response.data
}

export type UserApplication = {
  id: number
  universityId: number
  university?: University
  programId?: string | null
  status: string
  intake?: string | null
  applicationDeadline?: string | null
  submittedDate?: string | null
  resultDate?: string | null
  notes?: string | null
  priority: string
}

export async function fetchApplications(token: string) {
  const response = await apiFetchWithAuth<{ data: UserApplication[] }>("/user/applications", { token })
  return response.data
}

export async function createApplication(token: string, data: Partial<UserApplication> & { universityId: number }) {
  const response = await apiFetchWithAuth<{ data: UserApplication }>("/user/applications", {
    token,
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.data
}

export async function updateApplication(token: string, id: number, data: Partial<UserApplication>) {
  const response = await apiFetchWithAuth<{ data: UserApplication }>(`/user/applications/${id}`, {
    token,
    method: "PATCH",
    body: JSON.stringify(data),
  })
  return response.data
}

export async function deleteApplication(token: string, id: number) {
  return apiFetchWithAuth(`/user/applications/${id}`, { token, method: "DELETE" })
}

export type UserDocument = {
  id: number
  applicationId?: number | null
  checklistItemId?: number | null
  documentType: string
  title: string
  status: string
  fileName?: string | null
  fileType?: string | null
  fileSize?: number | null
  expirationDate?: string | null
  notes?: string | null
}

export async function fetchDocuments(token: string) {
  const response = await apiFetchWithAuth<{ data: UserDocument[] }>("/user/documents", { token })
  return response.data
}

export async function createDocumentItem(token: string, data: Partial<UserDocument> & { documentType: string; title: string }) {
  const response = await apiFetchWithAuth<{ data: UserDocument }>("/user/documents", {
    token,
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.data
}

export async function updateDocumentItem(token: string, id: number, data: Partial<UserDocument>) {
  const response = await apiFetchWithAuth<{ data: UserDocument }>(`/user/documents/${id}`, {
    token,
    method: "PATCH",
    body: JSON.stringify(data),
  })
  return response.data
}

export async function deleteDocumentItem(token: string, id: number) {
  return apiFetchWithAuth(`/user/documents/${id}`, { token, method: "DELETE" })
}

export type CalendarEventItem = {
  id: number
  title: string
  description?: string | null
  eventType: string
  startDate: string
  endDate?: string | null
  allDay: boolean
  universityId?: number | null
  university?: { id: number; name: string; slug?: string | null } | null
  applicationId?: number | null
  checklistItemId?: number | null
  status: string
}

export async function fetchCalendarEvents(token: string) {
  const response = await apiFetchWithAuth<{ data: CalendarEventItem[] }>("/user/calendar/events", { token })
  return response.data
}

export async function createCalendarEvent(token: string, data: Partial<CalendarEventItem> & { title: string; startDate: string }) {
  const response = await apiFetchWithAuth<{ data: CalendarEventItem }>("/user/calendar/events", {
    token,
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.data
}

export async function updateCalendarEvent(token: string, id: number, data: Partial<CalendarEventItem>) {
  const response = await apiFetchWithAuth<{ data: CalendarEventItem }>(`/user/calendar/events/${id}`, {
    token,
    method: "PATCH",
    body: JSON.stringify(data),
  })
  return response.data
}

export async function deleteCalendarEvent(token: string, id: number) {
  return apiFetchWithAuth(`/user/calendar/events/${id}`, { token, method: "DELETE" })
}

export async function fetchCalendarIcs(token: string, id?: number) {
  const path = id ? `/user/calendar/events/${id}/export.ics` : "/user/calendar/export.ics"
  const response = await fetch(getApiUrl(path), { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) throw new ApiRequestError("Could not export calendar.", { status: response.status })
  return response.text()
}

export async function trackAnalyticsEvent(data: {
  userId?: number | null
  sessionId?: string | null
  eventType: string
  entityType?: string | null
  entityId?: number | null
  metadata?: Record<string, unknown>
}) {
  return apiFetchWithAuth("/analytics/event", {
    method: "POST",
    body: JSON.stringify(data),
  }).catch(() => undefined)
}

export type AdminLoginResponse = {
  token: string
  admin: {
    id: number
    email: string
    role?: string
  }
}

export async function loginAdmin(data: { email: string; password: string }) {
  const response = await apiFetchWithAuth<{ data: AdminLoginResponse }>("/admin/login", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.data
}

export type StudentCouncilInput = {
  universityId: number
  name: string
  officialName?: string | null
  description: string
  websiteUrl?: string | null
  socialUrl?: string | null
  contactEmail?: string | null
  sourceUrl?: string | null
  verificationStatus?: StudentCouncil["verificationStatus"]
  lastVerifiedAt?: string | null
}

export type StudentCouncilRoleInput = {
  councilId: number
  universityId: number
  adminUserId?: number | null
  displayName?: string | null
  roleTitle: string
  department?: string | null
  description?: string | null
  responsibilities?: string[]
  contactEmail?: string | null
  contactUrl?: string | null
  avatarUrl?: string | null
  status?: StudentCouncilRole["status"]
  verificationStatus?: StudentCouncilRole["verificationStatus"]
  sourceUrl?: string | null
}

export type UniversityImageInput = {
  imageUrl?: string | null
  campusImageUrl?: string | null
  logoUrl?: string | null
  imageAlt?: string | null
  imageSourceUrl?: string | null
  imageLastVerifiedAt?: string | null
  lastVerifiedAt?: string | null
}

export async function updateModeratorUniversityImages(token: string, id: number, data: UniversityImageInput) {
  const response = await apiFetchWithAuth<UniversityDetailResponse>(`/moderator/universities/${id}/images`, {
    token,
    method: "PATCH",
    body: JSON.stringify(data),
  })
  return response.data
}

export async function createModeratorStudentCouncil(token: string, data: StudentCouncilInput) {
  const response = await apiFetchWithAuth<StudentCouncilResponse>("/moderator/student-councils", {
    token,
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.data
}

export async function updateModeratorStudentCouncil(token: string, id: number, data: Partial<StudentCouncilInput>) {
  const response = await apiFetchWithAuth<StudentCouncilResponse>(`/moderator/student-councils/${id}`, {
    token,
    method: "PATCH",
    body: JSON.stringify(data),
  })
  return response.data
}

export async function deleteModeratorStudentCouncil(token: string, id: number) {
  return apiFetchWithAuth(`/moderator/student-councils/${id}`, {
    token,
    method: "DELETE",
  })
}

export async function createModeratorStudentCouncilRole(token: string, data: StudentCouncilRoleInput) {
  const response = await apiFetchWithAuth<StudentCouncilRoleResponse>("/moderator/student-council-roles", {
    token,
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.data
}

export async function updateModeratorStudentCouncilRole(
  token: string,
  id: number,
  data: Partial<StudentCouncilRoleInput>,
) {
  const response = await apiFetchWithAuth<StudentCouncilRoleResponse>(`/moderator/student-council-roles/${id}`, {
    token,
    method: "PATCH",
    body: JSON.stringify(data),
  })
  return response.data
}

export async function deleteModeratorStudentCouncilRole(token: string, id: number) {
  return apiFetchWithAuth(`/moderator/student-council-roles/${id}`, {
    token,
    method: "DELETE",
  })
}

export async function saveModeratorProfile(
  token: string,
  data: {
    displayName?: string
    description?: string | null
    defaultRole?: string | null
    avatarUrl?: string | null
    contactEmail?: string | null
  },
) {
  return apiFetchWithAuth("/moderator/profile", {
    token,
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export type ModeratorQueue = {
  pendingPosts: CommunityPost[]
  reportedPosts: CommunityPost[]
  reportedComments: CommunityComment[]
  pendingUniversityReviews: unknown[]
  pendingStudentCouncilChanges: StudentCouncilRole[]
  pendingUniversityDataChanges: unknown[]
  verificationQueue: { id: number; name: string; campusImageUrl?: string | null; imageLastVerifiedAt?: string | null }[]
  reports: unknown[]
}

export async function fetchModeratorQueue(token: string) {
  const response = await apiFetchWithAuth<{ data: ModeratorQueue }>("/moderator/queue", { token })
  return response.data
}

export async function updateModeratorPostStatus(token: string, id: number, data: { status?: string; pinned?: boolean; officialAnswer?: string | null; note?: string | null }) {
  const response = await apiFetchWithAuth<{ data: CommunityPost }>(`/moderator/posts/${id}/status`, {
    token,
    method: "PATCH",
    body: JSON.stringify(data),
  })
  return response.data
}

export async function updateModeratorCommentStatus(token: string, id: number, data: { status?: string; official?: boolean; note?: string | null }) {
  const response = await apiFetchWithAuth<{ data: CommunityComment }>(`/moderator/comments/${id}/status`, {
    token,
    method: "PATCH",
    body: JSON.stringify(data),
  })
  return response.data
}

export async function fetchModeratorAnalyticsOverview(token: string) {
  const response = await apiFetchWithAuth<{ data: Record<string, unknown> }>("/moderator/analytics/overview", { token })
  return response.data
}

export async function fetchModeratorTopUniversities(token: string) {
  const response = await apiFetchWithAuth<{ data: { university?: { id: number; name: string; city: string }; count: number }[] }>(
    "/moderator/analytics/top-universities",
    { token },
  )
  return response.data
}

export async function fetchModeratorActivityLogs(token: string) {
  const response = await apiFetchWithAuth<{ data: unknown[] }>("/moderator/activity-logs", { token })
  return response.data
}

export async function sendModeratorAnnouncement(token: string, data: { title: string; message: string; priority?: string; linkUrl?: string | null }) {
  return apiFetchWithAuth("/moderator/notifications/announcement", {
    token,
    method: "POST",
    body: JSON.stringify(data),
  })
}
