import type { University } from "@/data/universities"

type UniversityListResponse = {
  data: University[]
}

type UniversityDetailResponse = {
  data: University
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
