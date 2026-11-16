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

const fallbackApiBaseUrl = "/api"
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
  if (import.meta.env.VITE_GITHUB_PAGES === 'true' && !import.meta.env.VITE_API_BASE_URL) {
    throw new Error('Account and community services are not connected to this preview yet.')
  }
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

export async function fetchUniversityPage(filters: Record<string, string | number | boolean | undefined> = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== "") params.set(key, String(value)) })
  return apiFetch<{ data: University[]; meta: { total: number; page: number; limit: number; pages: number } }>(`/universities?${params}`)
}

export async function fetchUniversities() {
  const response = await apiFetch<UniversityListResponse>("/universities?limit=100")
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
  disadvantages?: string[]
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

export async function fetchFollowedUniversities(token: string) {
  return (await apiFetchWithAuth<{ data: { university: University }[] }>("/user/followed-universities", { token })).data.map(item => item.university)
}
export async function followUniversityToAccount(token: string, universityId: number) {
  return apiFetchWithAuth("/user/followed-universities", { token, method: "POST", body: JSON.stringify({ universityId }) })
}
export async function unfollowUniversityFromAccount(token: string, universityId: number) {
  return apiFetchWithAuth(`/user/followed-universities/${universityId}`, { token, method: "DELETE" })
}

export async function updateEssayDraft(token: string, id: number, data: Partial<EssayDraft>) {
  return (await apiFetchWithAuth<DataResponse<EssayDraft>>(`/student-tools/essay-drafts/${id}`, { token, method: "PATCH", body: JSON.stringify(data) })).data
}
export async function deleteEssayDraft(token: string, id: number) {
  return apiFetchWithAuth(`/student-tools/essay-drafts/${id}`, { token, method: "DELETE" })
}
export async function deleteCostEstimate(token: string, id: number) {
  return apiFetchWithAuth(`/student-tools/cost-estimates/${id}`, { token, method: "DELETE" })
}
export type ScheduledReminder = { id: number; type: string; title: string; sendAt: string; status: string; metadata?: Record<string, unknown> | null; lastError?: string | null }
export async function fetchScheduledReminders(token: string) {
  return (await apiFetchWithAuth<DataResponse<ScheduledReminder[]>>("/student-tools/scheduled-reminders", { token })).data
}
export async function fetchReminderDeliveryStatus(token: string) {
  return (await apiFetchWithAuth<DataResponse<{ configured: boolean; message: string }>>("/student-tools/reminder-status", { token })).data
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
  sourceKey?: string | null
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
  pendingUniversityReviews: { id: number; comment: string; overallRating: number; university: { name: string }; user: { name: string } }[]
  pendingStudentCouncilChanges: StudentCouncilRole[]
  pendingUniversityDataChanges: unknown[]
  verificationQueue: { id: number; name: string; campusImageUrl?: string | null; imageLastVerifiedAt?: string | null }[]
  reports: ModeratorReport[]
}

export type ModeratorReport = {
  id: number
  reason: string
  details?: string | null
  status: string
  reporter?: { id: number; name: string } | null
  post?: { id: number; title: string; status: string } | null
  comment?: { id: number; content: string; status: string } | null
  createdAt: string
}

export type SupportMessage = {
  id: number
  name: string
  email: string
  universityOfInterest?: string | null
  subject: string
  message: string
  status: string
  createdAt: string
}

export async function fetchModeratorQueue(token: string) {
  const response = await apiFetchWithAuth<{ data: ModeratorQueue }>("/moderator/queue", { token })
  return response.data
}

export async function updateModeratorReportStatus(token: string, id: number, status: "pending" | "resolved" | "dismissed") {
  const response = await apiFetchWithAuth<{ data: ModeratorReport }>(`/moderator/reports/${id}/status`, {
    token,
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
  return response.data
}

export async function fetchModeratorSupportMessages(token: string) {
  const response = await apiFetchWithAuth<{ data: SupportMessage[] }>("/moderator/support-messages?limit=50", { token })
  return response.data
}

export async function updateModeratorSupportMessage(token: string, id: number, status: "new" | "in progress" | "resolved" | "closed") {
  const response = await apiFetchWithAuth<{ data: SupportMessage }>(`/moderator/support-messages/${id}`, {
    token,
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
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

type ListResponse<T> = {
  data: T[]
  meta?: Record<string, unknown>
}

type DataResponse<T> = {
  data: T
}

export type Program = {
  id: number
  universityId: number
  slug: string
  name: string
  degreeLevel: string
  languageOfInstruction: string
  tuition?: { min?: number | null; max?: number | null; currency?: string }
  duration?: string | null
  requirements: string[]
  requiredDocuments: string[]
  applicationPeriod?: string | null
  careerOutcomes: string[]
  officialLink?: string | null
  university?: University
}

export async function fetchPrograms(filters: Record<string, string | number | undefined> = {}) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value))
    }
  })

  const query = params.toString()
  const response = await apiFetch<ListResponse<Program>>(`/programs${query ? `?${query}` : ""}`)
  return response.data
}

export async function fetchProgram(slug: string) {
  const response = await apiFetch<DataResponse<Program>>(`/programs/${slug}`)
  return response.data
}

export async function fetchUniversityPrograms(idOrSlug: number | string) {
  const response = await apiFetch<ListResponse<Program>>(`/universities/${idOrSlug}/programs`)
  return response.data
}

export type RoadmapStep = {
  id?: number
  title: string
  description?: string | null
  completed: boolean
  dueDate?: string | null
  sortOrder?: number
  custom?: boolean
}

export type ApplicationRoadmap = {
  id?: number
  universityId?: number | null
  targetMajor: string
  degreeLevel: string
  intake: string
  preparationStatus: string
  deadlinePreference?: string | null
  progress: number
  university?: University | null
  steps: RoadmapStep[]
}

export type DocumentChecklistItem = {
  id?: number
  title: string
  description?: string | null
  completed: boolean
  optional?: boolean
  custom?: boolean
  sortOrder?: number
}

export type DocumentChecklist = {
  id?: number
  universityId?: number | null
  targetMajor?: string | null
  degreeLevel: string
  nationality?: string | null
  languageTrack: string
  progress: number
  university?: University | null
  items: DocumentChecklistItem[]
}

export type EssayFeedback = {
  wordCount: number
  characterCount: number
  tone: string
  suggestions: string[]
  structure: string[]
}

export type EssayDraft = {
  id?: number
  title: string
  targetUniversity?: string | null
  targetMajor?: string | null
  prompt?: string | null
  content: string
  feedback?: EssayFeedback | null
  wordCount: number
  characterCount: number
}

export type CostEstimate = {
  id?: number
  universityId?: number | null
  name: string
  inputs: Record<string, number | string | null>
  breakdown: Record<string, number>
  monthlyCost: number
  semesterCost: number
  yearlyCost: number
  firstYearCost: number
  university?: University | null
}

export type EligibilityResult = {
  id?: number
  universityId?: number | null
  targetProgram: string
  degreeLevel: string
  educationLevel?: string | null
  gpa?: number | null
  englishScore?: string | null
  koreanScore?: string | null
  budget?: number | null
  nationality?: string | null
  preferredLanguage?: string | null
  status: string
  score: number
  missingRequirements: string[]
  nextSteps: string[]
  rawInput?: Record<string, unknown>
  university?: University | null
}

export type ReminderPreference = {
  emailEnabled: boolean
  applicationDeadline: boolean
  documentChecklist: boolean
  roadmapStep: boolean
  visaChecklist: boolean
  savedUniversityDeadline: boolean
  reminderDays: number[]
  customEmail?: string | null
}

export type UniversityReview = {
  id?: number
  universityId: number
  author?: { id: number; name: string } | null
  academics: number
  campusLife: number
  dormitory: number
  internationalSupport: number
  difficulty: number
  costValue: number
  location: number
  overallRating: number
  comment: string
  status?: string
  createdAt?: string
}

export async function fetchRoadmaps(token: string) {
  const response = await apiFetchWithAuth<ListResponse<ApplicationRoadmap>>("/student-tools/roadmaps", { token })
  return response.data
}

export async function createRoadmap(
  token: string,
  data: Omit<ApplicationRoadmap, "id" | "progress" | "steps" | "university">,
) {
  const response = await apiFetchWithAuth<DataResponse<ApplicationRoadmap>>("/student-tools/roadmaps", {
    token,
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.data
}

export async function updateRoadmapStep(token: string, stepId: number, data: Partial<RoadmapStep>) {
  const response = await apiFetchWithAuth<DataResponse<ApplicationRoadmap>>(`/student-tools/roadmap-steps/${stepId}`, {
    token,
    method: "PATCH",
    body: JSON.stringify(data),
  })
  return response.data
}

export async function fetchDocumentChecklists(token: string) {
  const response = await apiFetchWithAuth<ListResponse<DocumentChecklist>>("/student-tools/document-checklists", { token })
  return response.data
}

export async function createDocumentChecklist(
  token: string,
  data: Omit<DocumentChecklist, "id" | "progress" | "items" | "university">,
) {
  const response = await apiFetchWithAuth<DataResponse<DocumentChecklist>>("/student-tools/document-checklists", {
    token,
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.data
}

export async function updateDocumentChecklistItem(
  token: string,
  itemId: number,
  data: Partial<DocumentChecklistItem>,
) {
  const response = await apiFetchWithAuth<DataResponse<DocumentChecklist>>(
    `/student-tools/document-checklist-items/${itemId}`,
    {
      token,
      method: "PATCH",
      body: JSON.stringify(data),
    },
  )
  return response.data
}

export async function fetchEssayDrafts(token: string) {
  const response = await apiFetchWithAuth<ListResponse<EssayDraft>>("/student-tools/essay-drafts", { token })
  return response.data
}

export async function createEssayDraft(token: string, data: Omit<EssayDraft, "id" | "feedback" | "wordCount" | "characterCount">) {
  const response = await apiFetchWithAuth<DataResponse<EssayDraft>>("/student-tools/essay-drafts", {
    token,
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.data
}

export async function fetchEssayFeedback(token: string, data: { content: string; title?: string; targetMajor?: string }) {
  const response = await apiFetchWithAuth<DataResponse<EssayFeedback>>("/student-tools/essay-feedback", {
    token,
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.data
}

export async function fetchVisaChecklist(token: string) {
  const response = await apiFetchWithAuth<ListResponse<RoadmapStep>>("/student-tools/visa-checklist", { token })
  return response.data
}

export async function updateVisaChecklistItem(token: string, itemId: number, data: Partial<RoadmapStep>) {
  const response = await apiFetchWithAuth<DataResponse<RoadmapStep>>(`/student-tools/visa-checklist/${itemId}`, {
    token,
    method: "PATCH",
    body: JSON.stringify(data),
  })
  return response.data
}

export async function fetchCostEstimates(token: string) {
  const response = await apiFetchWithAuth<ListResponse<CostEstimate>>("/student-tools/cost-estimates", { token })
  return response.data
}

export async function createCostEstimate(token: string, data: Record<string, number | string | null>) {
  const response = await apiFetchWithAuth<DataResponse<CostEstimate>>("/student-tools/cost-estimates", {
    token,
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.data
}

export async function fetchEligibilityResults(token: string) {
  const response = await apiFetchWithAuth<ListResponse<EligibilityResult>>("/student-tools/eligibility-results", { token })
  return response.data
}

export async function createEligibilityCheck(token: string, data: Record<string, unknown>) {
  const response = await apiFetchWithAuth<DataResponse<EligibilityResult>>("/student-tools/eligibility-checks", {
    token,
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.data
}

export async function fetchReminderPreference(token: string) {
  const response = await apiFetchWithAuth<DataResponse<ReminderPreference>>("/student-tools/reminder-preferences", {
    token,
  })
  return response.data
}

export async function updateReminderPreference(token: string, data: ReminderPreference) {
  const response = await apiFetchWithAuth<DataResponse<ReminderPreference>>("/student-tools/reminder-preferences", {
    token,
    method: "PUT",
    body: JSON.stringify(data),
  })
  return response.data
}

export async function fetchUniversityReviews(universityId: number) {
  const response = await apiFetch<ListResponse<UniversityReview> & { meta?: { count?: number; average?: number | null } }>(
    `/reviews/universities/${universityId}`,
  )
  return response
}

export async function submitUniversityReview(token: string, universityId: number, data: Omit<UniversityReview, "id" | "universityId">) {
  const response = await apiFetchWithAuth<DataResponse<UniversityReview>>(`/reviews/universities/${universityId}`, {
    token,
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.data
}

export type ManagedContentKind = 'news' | 'forum' | 'qa' | 'members'
export async function fetchManagedContent<T>(kind: ManagedContentKind) {
  return (await apiFetch<{ data: T[] | null }>(`/content/${kind}`)).data
}
export async function saveManagedContent<T>(token: string, kind: ManagedContentKind, payload: T[]) {
  return (await apiFetchWithAuth<{ data: { payload: T[] } }>(`/moderator/content/${kind}`, { token, method: 'PUT', body: JSON.stringify({ payload }) })).data
}

export async function saveCatalogItem(token: string, kind: 'universities' | 'programs', id: number | null, data: Record<string, unknown>) {
  return apiFetchWithAuth(`/moderator/${kind}${id ? `/${id}` : ''}`, { token, method: id ? 'PATCH' : 'POST', body: JSON.stringify(data) })
}
export async function moderateUniversityReview(token: string, id: number, status: string) {
  return apiFetchWithAuth(`/moderator/reviews/${id}/status`, { token, method: 'PATCH', body: JSON.stringify({ status }) })
}
export async function updateCommunityComment(token: string, id: number, content: string) {
  return apiFetchWithAuth(`/community/comments/${id}`, { token, method: 'PATCH', body: JSON.stringify({ content }) })
}
export async function deleteCommunityComment(token: string, id: number) {
  return apiFetchWithAuth(`/community/comments/${id}`, { token, method: 'DELETE' })
}
