import rateLimit from "express-rate-limit"

export function createAuthLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { error: { message: "Too many authentication attempts. Try again in 15 minutes." } },
  })
}

export function createContactLimiter() {
  return rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: { message: "Too many support messages. Try again later." } },
  })
}
