import cors from "cors"
import express from "express"
import rateLimit from "express-rate-limit"
import helmet from "helmet"
import { getCorsOrigins } from "./config.js"
import { errorHandler, notFoundHandler } from "./errors.js"
import { createAnalyticsRouter } from "./routes/analytics.js"
import { createAdminUniversityRouter } from "./routes/adminUniversities.js"
import { createAuthRouter } from "./routes/auth.js"
import { createCommunityRouter } from "./routes/community.js"
import { createContactRouter } from "./routes/contact.js"
import { createModeratorRouter } from "./routes/moderator.js"
import { createNotificationRouter } from "./routes/notifications.js"
import { createStudentCouncilRouter } from "./routes/studentCouncils.js"
import { createStudentAuthRouter } from "./routes/studentAuth.js"
import { createUserRouter } from "./routes/user.js"
import { createUniversityRouter } from "./routes/universities.js"

export function createApp({ prisma }) {
  const app = express()

  app.disable("x-powered-by")
  app.use(helmet())
  app.use(
    cors({
      origin: getCorsOrigins(),
      credentials: true,
    }),
  )
  app.use(express.json({ limit: "1mb" }))
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  )

  app.get("/api/health", (req, res) => {
    res.json({ data: { status: "ok" } })
  })

  app.use("/api/universities", createUniversityRouter(prisma))
  app.use("/api/student-councils", createStudentCouncilRouter(prisma))
  app.use("/api/community", createCommunityRouter(prisma))
  app.use("/api/notifications", createNotificationRouter(prisma))
  app.use("/api/analytics", createAnalyticsRouter(prisma))
  app.use("/api/auth", createStudentAuthRouter(prisma))
  app.use("/api/user", createUserRouter(prisma))
  app.use("/api/contact", createContactRouter(prisma))
  app.use("/api/admin", createAuthRouter(prisma))
  app.use("/api/admin/universities", createAdminUniversityRouter(prisma))
  app.use("/api/moderator", createModeratorRouter(prisma))
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
