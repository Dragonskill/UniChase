import { Router } from "express"
import { asyncHandler } from "../errors.js"
import { contactSchema, validateBody } from "../validation.js"

export function createContactRouter(prisma) {
  const router = Router()

  router.post(
    "/",
    validateBody(contactSchema),
    asyncHandler(async (req, res) => {
      const message = await prisma.contactMessage.create({
        data: req.body,
      })

      res.status(201).json({
        data: {
          id: message.id,
          status: message.status,
          createdAt: message.createdAt,
        },
      })
    }),
  )

  return router
}
