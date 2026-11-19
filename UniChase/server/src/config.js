import dotenv from "dotenv"

dotenv.config({ quiet: true })

export function getCorsOrigins() {
  const configuredOrigin = process.env.CORS_ORIGIN

  if (!configuredOrigin) {
    return ["http://localhost:5173", "http://127.0.0.1:5173"]
  }

  if (configuredOrigin === "*") {
    throw new Error("CORS_ORIGIN must list explicit origins when credentials are enabled")
  }

  return configuredOrigin
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
}

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET || process.env.AUTH_SECRET

  if (!secret || secret.length < 32 || /replace-with|changeme|example-secret/i.test(secret)) {
    throw new Error("JWT_SECRET or AUTH_SECRET must contain at least 32 random characters and cannot use a placeholder.")
  }

  return secret
}

export function getPort() {
  const port = Number(process.env.PORT || 3001)
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT must be an integer between 1 and 65535")
  return port
}

export function getTrustProxyHops() {
  const hops = Number(process.env.TRUST_PROXY_HOPS || 0)
  if (!Number.isInteger(hops) || hops < 0 || hops > 1) throw new Error("TRUST_PROXY_HOPS must be 0 (direct) or 1 (one trusted reverse proxy)")
  return hops
}

export function assertRequiredEnv() {
  const missing = []

  if (!process.env.DATABASE_URL) {
    missing.push("DATABASE_URL")
  }

  if (!process.env.JWT_SECRET && !process.env.AUTH_SECRET) {
    missing.push("JWT_SECRET")
  }

  if (missing.length === 0) { getJwtSecret(); getPort(); getCorsOrigins(); getTrustProxyHops() }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`)
  }
}
