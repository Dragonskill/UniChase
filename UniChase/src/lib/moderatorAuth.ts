const sessionKey = 'unichase.moderatorSession'
export const moderatorAuthChangeEvent = 'unichase:moderator-auth-change'
export type ModeratorSession = { adminId?: number; name: string; email: string; token: string; role?: string; signedInAt: string }
function notify() { window.dispatchEvent(new Event(moderatorAuthChangeEvent)) }
export function setModeratorSession(session: Omit<ModeratorSession, 'signedInAt'>) {
  const value = { ...session, signedInAt: new Date().toISOString() }
  sessionStorage.setItem(sessionKey, JSON.stringify(value))
  localStorage.removeItem(sessionKey)
  notify()
  return value
}
export function getModeratorSession(): ModeratorSession | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(sessionKey) || 'null')
    return typeof value?.token === 'string' && value.token.split('.').length === 3 ? value : null
  } catch { return null }
}
export function logoutModerator() {
  sessionStorage.removeItem(sessionKey)
  localStorage.removeItem(sessionKey)
  notify()
}
