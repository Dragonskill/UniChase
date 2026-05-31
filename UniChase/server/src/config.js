import dotenv from "dotenv"

dotenv.config({ quiet: true })

export function getCorsOrigins() {
  const configuredOrigin = process.env.CORS_ORIGIN

  if (!configuredOrigin) {
    return ["http://localhost:5173", "http://127.0.0.1:5173"]
  }

  if (configuredOrigin === "*") {
    return true
  }

  return configuredOrigin
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
}

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET || process.env.AUTH_SECRET

  if (!secret) {
    throw new Error("JWT_SECRET or AUTH_SECRET must be set.")
  }

  return secret
}

export function getPort() {
  return Number(process.env.PORT || 3001)
}

export function assertRequiredEnv() {
  const missing = []

  if (!process.env.DATABASE_URL) {
    missing.push("DATABASE_URL")
  }

  if (!process.env.JWT_SECRET && !process.env.AUTH_SECRET) {
    missing.push("JWT_SECRET")
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`)
  }
}
