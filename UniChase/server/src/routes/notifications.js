import { parsePagination } from "../pagination.js"
import { Router } from "express"
import { requireStudent } from "../auth.js"
import { ApiError, asyncHandler } from "../errors.js"
import { parsePositiveId } from "../universityQuery.js"

export function createNotificationRouter(prisma) {
  const router = Router()

  router.use(requireStudent(prisma))

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const type = typeof req.query.type === "string" ? req.query.type : undefined
      const unreadOnly = req.query.unread === "true"
      const { take, skip } = parsePagination(req.query)
      const notifications = await prisma.notification.findMany({
        where: {
          userId: req.user.id,
          ...(type ? { type } : {}),
          ...(unreadOnly ? { isRead: false } : {}),
        },
        orderBy: { createdAt: "desc" },
        take, skip,
      })

      res.json({ data: notifications })
    }),
  )

  router.get(
    "/unread-count",
    asyncHandler(async (req, res) => {
      const count = await prisma.notification.count({ where: { userId: req.user.id, isRead: false } })
      res.json({ data: { count } })
    }),
  )

  router.patch(
    "/:id/read",
    asyncHandler(async (req, res) => {
      const id = parsePositiveId(req.params.id)
      await prisma.notification.updateMany({
        where: { id, userId: req.user.id },
        data: { isRead: true },
      })
      const notification = await prisma.notification.findFirst({ where: { id, userId: req.user.id } })

      if (!notification) throw new ApiError(404, "Notification not found")
      res.json({ data: notification })
    }),
  )

  router.patch(
    "/read-all",
    asyncHandler(async (req, res) => {
      const result = await prisma.notification.updateMany({
        where: { userId: req.user.id, isRead: false },
        data: { isRead: true },
      })

      res.json({ data: { updated: result.count } })
    }),
  )

  router.delete(
    "/:id",
    asyncHandler(async (req, res) => {
      await prisma.notification.deleteMany({ where: { id: parsePositiveId(req.params.id), userId: req.user.id } })

      res.json({ data: { ok: true } })
    }),
  )

  return router
}
