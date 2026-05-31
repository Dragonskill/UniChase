import { Router } from "express"
import bcrypt from "bcryptjs"
import { signStudentToken, verifyPassword } from "../auth.js"
import { ApiError, asyncHandler } from "../errors.js"
import { userLoginSchema, userRegisterSchema, validateBody } from "../validation.js"

function mapUser(user) {
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

export function createStudentAuthRouter(prisma) {
  const router = Router()

  router.post(
    "/register",
    validateBody(userRegisterSchema),
    asyncHandler(async (req, res) => {
      const existingUser = await prisma.studentUser.findUnique({
        where: { email: req.body.email },
      })

      if (existingUser) {
        throw new ApiError(400, "A student account already exists for this email")
      }

      const passwordHash = await bcrypt.hash(req.body.password, 12)
      const user = await prisma.studentUser.create({
        data: {
          name: req.body.name,
          email: req.body.email,
          passwordHash,
          checklistItems: {
            create: [
              { title: "Choose target universities" },
              { title: "Prepare academic transcripts" },
              { title: "Check language requirements" },
              { title: "Track application deadlines" },
            ],
          },
        },
      })

      res.status(201).json({
        data: {
          token: signStudentToken(user),
          user: mapUser(user),
        },
      })
    }),
  )

  router.post(
    "/login",
    validateBody(userLoginSchema),
    asyncHandler(async (req, res) => {
      const user = await prisma.studentUser.findUnique({
        where: { email: req.body.email },
      })

      if (!user) {
        throw new ApiError(401, "Invalid login credentials")
      }

      const validPassword = await verifyPassword(req.body.password, user.passwordHash)

      if (!validPassword) {
        throw new ApiError(401, "Invalid login credentials")
      }

      res.json({
        data: {
          token: signStudentToken(user),
          user: mapUser(user),
        },
      })
    }),
  )

  router.post("/logout", (req, res) => {
    res.json({ data: { ok: true } })
  })

  return router
}
