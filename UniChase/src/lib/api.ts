import type { University } from "@/data/universities"

type UniversityListResponse = {
  data: University[]
}

type UniversityDetailResponse = {
  data: University
}

type ListResponse<T> = {
  data: T[]
  meta?: Record<string, unknown>
}

type DataResponse<T> = {
  data: T
}

const fallbackApiBaseUrl = "http://localhost:3001/api"
const requestTimeoutMs = 8000

function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL || fallbackApiBaseUrl).replace(/\/$/, "")
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
