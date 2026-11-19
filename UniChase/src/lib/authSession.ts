import { ApiRequestError, loginStudent, registerStudent, type StudentUser } from "@/lib/api"

// Legacy browser-only sessions are not authenticated accounts.
export function isLocalAuthToken(token: string | null | undefined) { return token?.startsWith("local-student:") ?? false }
export function getLocalSessionUser(): StudentUser | null { return null }
export function updateLocalSessionUser(): StudentUser | null { return null }

export async function registerStudentAccount(data: { name: string; email: string; password: string }) {
  const response = await registerStudent({ ...data, name: data.name.trim(), email: data.email.trim().toLowerCase() })
  return { ...response.data, mode: "api" as const }
}
export async function loginStudentAccount(data: { email: string; password: string }) {
  const response = await loginStudent({ ...data, email: data.email.trim().toLowerCase() })
  return { ...response.data, mode: "api" as const }
}
export function getAuthErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError && (error.isNetworkError || (error.status ?? 0) >= 500)) return "Sign-in is temporarily unavailable. Please try again shortly."
  return error instanceof Error ? error.message : "Authentication failed. Please try again."
}
