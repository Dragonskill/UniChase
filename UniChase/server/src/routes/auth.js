import { Router } from "express"
import { signAdminToken, verifyPassword } from "../auth.js"
import { ApiError, asyncHandler } from "../errors.js"
import { adminLoginSchema, validateBody } from "../validation.js"

export function createAuthRouter(prisma) {
  const router = Router()

  router.post(
    "/login",
    validateBody(adminLoginSchema),
    asyncHandler(async (req, res) => {
      const admin = await prisma.adminUser.findUnique({
        where: { email: req.body.email },
      })

      if (!admin) {
        throw new ApiError(401, "Invalid admin credentials")
      }

      const validPassword = await verifyPassword(req.body.password, admin.passwordHash)

      if (!validPassword) {
        throw new ApiError(401, "Invalid admin credentials")
      }

      res.json({
        data: {
          token: signAdminToken(admin),
          admin: {
            id: admin.id,
            email: admin.email,
            role: admin.role,
          },
        },
      })
    }),
  )

  return router
}
