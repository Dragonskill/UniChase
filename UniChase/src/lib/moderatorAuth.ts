const moderatorKey = 'unichase.moderatorAccount'
const moderatorSessionKey = 'unichase.moderatorSession'

export const moderatorAuthChangeEvent = 'unichase:moderator-auth-change'

export type ModeratorAccount = {
  name: string
  email: string
  passwordHash: string
  createdAt: string
}

type ModeratorSession = {
  adminId?: number
  name: string
  email: string
  token?: string
  signedInAt: string
}

function notifyModeratorAuthChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(moderatorAuthChangeEvent))
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

async function hashPassword(email: string, password: string) {
  const input = `${normalizeEmail(email)}:${password}`

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const bytes = new TextEncoder().encode(input)
    const digest = await crypto.subtle.digest('SHA-256', bytes)
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
  }

  return `fallback:${input}`
}

function readAccount() {
  try {
    const raw = localStorage.getItem(moderatorKey)
    return raw ? (JSON.parse(raw) as ModeratorAccount) : null
  } catch {
    return null
  }
}

function writeSession(account: Pick<ModeratorAccount, 'name' | 'email'>) {
  const session: ModeratorSession = {
    name: account.name,
    email: account.email,
    signedInAt: new Date().toISOString(),
  }

  localStorage.setItem(moderatorSessionKey, JSON.stringify(session))
  notifyModeratorAuthChange()
  return session
}

export function setModeratorSession(session: Omit<ModeratorSession, 'signedInAt'>) {
  const nextSession: ModeratorSession = {
    ...session,
    signedInAt: new Date().toISOString(),
  }

  localStorage.setItem(moderatorSessionKey, JSON.stringify(nextSession))
  notifyModeratorAuthChange()
  return nextSession
}

export function getModeratorSession() {
  try {
    const raw = localStorage.getItem(moderatorSessionKey)
    return raw ? (JSON.parse(raw) as ModeratorSession) : null
  } catch {
    return null
  }
}

export function hasModeratorAccount() {
  return Boolean(readAccount())
}

export async function claimModeratorAccount(data: { name: string; email: string; password: string }) {
  if (readAccount()) {
    throw new Error('Moderator account already exists on this browser.')
  }

  const account: ModeratorAccount = {
    name: data.name.trim(),
    email: normalizeEmail(data.email),
    passwordHash: await hashPassword(data.email, data.password),
    createdAt: new Date().toISOString(),
  }

  localStorage.setItem(moderatorKey, JSON.stringify(account))
  return writeSession(account)
}

export async function loginModerator(data: { email: string; password: string }) {
  const account = readAccount()

  if (!account) {
    throw new Error('Create your moderator account first.')
  }

  const passwordHash = await hashPassword(data.email, data.password)

  if (account.email !== normalizeEmail(data.email) || account.passwordHash !== passwordHash) {
    throw new Error('Invalid moderator login.')
  }

  return writeSession(account)
}

export function logoutModerator() {
  localStorage.removeItem(moderatorSessionKey)
  notifyModeratorAuthChange()
}
