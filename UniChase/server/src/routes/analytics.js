import { Router } from "express"
import { asyncHandler } from "../errors.js"
import { analyticsEventSchema, validateBody } from "../validation.js"

export function createAnalyticsRouter(prisma) {
  const router = Router()

  router.post(
    "/event",
    validateBody(analyticsEventSchema),
    asyncHandler(async (req, res) => {
      const event = await prisma.analyticsEvent.create({
        data: {
          userId: req.body.userId,
          sessionId: req.body.sessionId,
          eventType: req.body.eventType,
          entityType: req.body.entityType,
          entityId: req.body.entityId,
          metadata: req.body.metadata,
        },
      })

      res.status(201).json({ data: { id: event.id } })
    }),
  )

  return router
}
