import { ApiRequestError, loginStudent, registerStudent, type StudentUser } from "@/lib/api"

type AuthMode = "api" | "local"

type AuthResult = {
  token: string
  user: StudentUser
  mode: AuthMode
}

type LocalStudentUser = StudentUser & {
  passwordHash: string
  createdAt: string
  updatedAt: string
}

const localUsersKey = "unichase.localStudentUsers"
const localTokenPrefix = "local-student:"

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function readLocalUsers() {
  try {
    const raw = localStorage.getItem(localUsersKey)
    return raw ? (JSON.parse(raw) as LocalStudentUser[]) : []
  } catch {
    return []
  }
}

function writeLocalUsers(users: LocalStudentUser[]) {
  localStorage.setItem(localUsersKey, JSON.stringify(users))
}

function toStudentUser(user: LocalStudentUser): StudentUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    preferredMajor: user.preferredMajor,
    preferredCity: user.preferredCity,
    preferredLevel: user.preferredLevel,
    budgetMin: user.budgetMin,
    budgetMax: user.budgetMax,
  }
}

function getTokenUserId(token: string | null | undefined) {
  if (!token?.startsWith(localTokenPrefix)) {
    return null
  }

  const id = Number(token.slice(localTokenPrefix.length).split(":")[0])
  return Number.isFinite(id) ? id : null
}

function createLocalToken(userId: number) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`

  return `${localTokenPrefix}${userId}:${random}`
}

async function hashLocalPassword(email: string, password: string) {
  const input = `${normalizeEmail(email)}:${password}`

  if (typeof crypto !== "undefined" && crypto.subtle) {
    const bytes = new TextEncoder().encode(input)
    const digest = await crypto.subtle.digest("SHA-256", bytes)
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")
  }

  return `fallback:${input}`
}

function shouldUseLocalFallback(error: unknown) {
  return (
    error instanceof ApiRequestError &&
    (error.isNetworkError || error.status === 404 || error.status === 405 || Boolean(error.status && error.status >= 500))
  )
}

async function registerLocalStudent(data: { name: string; email: string; password: string }): Promise<AuthResult> {
  const email = normalizeEmail(data.email)
  const users = readLocalUsers()

  if (users.some((user) => user.email === email)) {
    throw new Error("A student account already exists for this email")
  }

  const now = new Date().toISOString()
  const nextId = Math.max(1000, ...users.map((user) => user.id)) + 1
  const user: LocalStudentUser = {
    id: nextId,
    name: data.name.trim(),
    email,
    passwordHash: await hashLocalPassword(email, data.password),
    preferredMajor: null,
    preferredCity: null,
    preferredLevel: null,
    budgetMin: null,
    budgetMax: null,
    createdAt: now,
    updatedAt: now,
  }

  writeLocalUsers([...users, user])

  return {
    token: createLocalToken(user.id),
    user: toStudentUser(user),
    mode: "local",
  }
}

async function loginLocalStudent(data: { email: string; password: string }): Promise<AuthResult> {
  const email = normalizeEmail(data.email)
  const user = readLocalUsers().find((item) => item.email === email)
  const passwordHash = await hashLocalPassword(email, data.password)

  if (!user || user.passwordHash !== passwordHash) {
    throw new Error("Invalid login credentials")
  }

  return {
    token: createLocalToken(user.id),
    user: toStudentUser(user),
    mode: "local",
  }
}

export function isLocalAuthToken(token: string | null | undefined) {
  return token?.startsWith(localTokenPrefix) ?? false
}

export function getLocalSessionUser(token: string | null | undefined) {
  const userId = getTokenUserId(token)

  if (!userId) {
    return null
  }

  const user = readLocalUsers().find((item) => item.id === userId)
  return user ? toStudentUser(user) : null
}

export function updateLocalSessionUser(token: string, updates: StudentUser) {
  const userId = getTokenUserId(token)

  if (!userId) {
    return null
  }

  let updatedUser: LocalStudentUser | null = null
  const users = readLocalUsers().map((user) => {
    if (user.id !== userId) {
      return user
    }

    updatedUser = {
      ...user,
      name: updates.name.trim(),
      preferredMajor: updates.preferredMajor || null,
      preferredCity: updates.preferredCity || null,
      preferredLevel: updates.preferredLevel || null,
      budgetMin: updates.budgetMin ?? null,
      budgetMax: updates.budgetMax ?? null,
      updatedAt: new Date().toISOString(),
    }

    return updatedUser
  })

  if (!updatedUser) {
    return null
  }

  writeLocalUsers(users)
  return toStudentUser(updatedUser)
}

export async function registerStudentAccount(data: { name: string; email: string; password: string }) {
  const normalizedData = {
    ...data,
    name: data.name.trim(),
    email: normalizeEmail(data.email),
  }

  try {
    const response = await registerStudent(normalizedData)
    return { ...response.data, mode: "api" as const }
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      return registerLocalStudent(normalizedData)
    }

    throw error
  }
}

export async function loginStudentAccount(data: { email: string; password: string }) {
  const normalizedData = {
    ...data,
    email: normalizeEmail(data.email),
  }

  try {
    const response = await loginStudent(normalizedData)
    return { ...response.data, mode: "api" as const }
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      return loginLocalStudent(normalizedData)
    }

    throw error
  }
}

export function getAuthErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return "Authentication failed. Please try again."
}
