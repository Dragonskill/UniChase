import { Router } from "express"
import { requireStudent } from "../auth.js"
import { ApiError, asyncHandler, isPrismaMissingRecord } from "../errors.js"
import { mapUniversityForClient } from "../mappers/universityMapper.js"
import {
  checklistPatchSchema,
  savedUniversitySchema,
  userDeadlineSchema,
  userProfileSchema,
  validateBody,
} from "../validation.js"

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

function selectProfile() {
  return {
    id: true,
    name: true,
    email: true,
    preferredMajor: true,
    preferredCity: true,
    preferredLevel: true,
    budgetMin: true,
    budgetMax: true,
  }
}

export function createUserRouter(prisma) {
  const router = Router()

  router.use(requireStudent(prisma))

  router.get(
    "/profile",
    asyncHandler(async (req, res) => {
      const user = await prisma.studentUser.findUnique({
        where: { id: req.user.id },
        select: selectProfile(),
      })

      res.json({ data: mapUser(user) })
    }),
  )

  router.patch(
    "/profile",
    validateBody(userProfileSchema),
    asyncHandler(async (req, res) => {
      const user = await prisma.studentUser.update({
        where: { id: req.user.id },
        data: req.body,
        select: selectProfile(),
      })

      res.json({ data: mapUser(user) })
    }),
  )

  router.get(
    "/saved-universities",
    asyncHandler(async (req, res) => {
      const saved = await prisma.savedUniversity.findMany({
        where: { userId: req.user.id },
        include: { university: true },
        orderBy: { createdAt: "desc" },
      })

      res.json({
        data: saved.map((item) => ({
          notes: item.notes,
          createdAt: item.createdAt,
          university: mapUniversityForClient(item.university),
        })),
      })
    }),
  )

  router.post(
    "/saved-universities",
    validateBody(savedUniversitySchema),
    asyncHandler(async (req, res) => {
      const university = await prisma.university.findUnique({
        where: { id: req.body.universityId },
      })

      if (!university) {
        throw new ApiError(404, "University not found")
      }

      const saved = await prisma.savedUniversity.upsert({
        where: {
          userId_universityId: {
            userId: req.user.id,
            universityId: req.body.universityId,
          },
        },
        update: { notes: req.body.notes },
        create: {
          userId: req.user.id,
          universityId: req.body.universityId,
          notes: req.body.notes,
        },
        include: { university: true },
      })

      res.status(201).json({
        data: {
          notes: saved.notes,
          university: mapUniversityForClient(saved.university),
        },
      })
    }),
  )

  router.delete(
    "/saved-universities/:id",
    asyncHandler(async (req, res) => {
      const universityId = Number(req.params.id)

      if (!Number.isInteger(universityId) || universityId <= 0) {
        throw new ApiError(400, "Invalid university id")
      }

      try {
        await prisma.savedUniversity.delete({
          where: {
            userId_universityId: {
              userId: req.user.id,
              universityId,
            },
          },
        })
      } catch (error) {
        if (!isPrismaMissingRecord(error)) {
          throw error
        }
      }

      res.json({ data: { ok: true } })
    }),
  )

  router.get(
    "/deadlines",
    asyncHandler(async (req, res) => {
      const reminders = await prisma.userDeadline.findMany({
        where: { userId: req.user.id },
        include: { university: true },
        orderBy: [{ important: "desc" }, { updatedAt: "desc" }],
      })

      res.json({
        data: reminders.map((item) => ({
          id: item.id,
          deadlineType: item.deadlineType,
          important: item.important,
          note: item.note,
          university: mapUniversityForClient(item.university),
        })),
      })
    }),
  )

  router.post(
    "/deadlines",
    validateBody(userDeadlineSchema),
    asyncHandler(async (req, res) => {
      const reminder = await prisma.userDeadline.upsert({
        where: {
          userId_universityId_deadlineType: {
            userId: req.user.id,
            universityId: req.body.universityId,
            deadlineType: req.body.deadlineType,
          },
        },
        update: {
          important: req.body.important,
          note: req.body.note,
        },
        create: {
          userId: req.user.id,
          universityId: req.body.universityId,
          deadlineType: req.body.deadlineType,
          important: req.body.important,
          note: req.body.note,
        },
        include: { university: true },
      })

      res.status(201).json({
        data: {
          id: reminder.id,
          deadlineType: reminder.deadlineType,
          important: reminder.important,
          note: reminder.note,
          university: mapUniversityForClient(reminder.university),
        },
      })
    }),
  )

  router.get(
    "/checklist",
    asyncHandler(async (req, res) => {
      const items = await prisma.checklistItem.findMany({
        where: { userId: req.user.id },
        orderBy: { id: "asc" },
      })

      res.json({ data: items })
    }),
  )

  router.patch(
    "/checklist",
    validateBody(checklistPatchSchema),
    asyncHandler(async (req, res) => {
      await prisma.checklistItem.deleteMany({ where: { userId: req.user.id } })
      const items = await prisma.checklistItem.createManyAndReturn({
        data: req.body.items.map((item) => ({
          userId: req.user.id,
          title: item.title,
          completed: item.completed,
          dueDate: item.dueDate,
        })),
      })

      res.json({ data: items })
    }),
  )

  return router
}
