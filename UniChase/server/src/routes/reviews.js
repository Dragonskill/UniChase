import { Router } from "express"
import { z } from "zod"
import { requireStudent } from "../auth.js"
import { ApiError, asyncHandler, isPrismaMissingRecord } from "../errors.js"

const rating = z.coerce.number().int().min(1).max(5)

const reviewSchema = z.object({
  academics: rating,
  campusLife: rating,
  dormitory: rating,
  internationalSupport: rating,
  difficulty: rating,
  costValue: rating,
  location: rating,
  overallRating: rating,
  comment: z.string().trim().min(20).max(2000),
})

function validateReview(body) {
  const parsed = reviewSchema.safeParse(body)

  if (!parsed.success) {
    throw new ApiError(
      400,
      "Validation failed",
      parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    )
  }

  return parsed.data
}

function parsePositiveId(value, label = "id") {
  const id = Number(value)

  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, `Invalid ${label}`)
  }

  return id
}

function mapReview(review) {
  return {
    id: review.id,
    universityId: review.universityId,
    author: review.user ? { id: review.user.id, name: review.user.name } : null,
    academics: review.academics,
    campusLife: review.campusLife,
    dormitory: review.dormitory,
    internationalSupport: review.internationalSupport,
    difficulty: review.difficulty,
    costValue: review.costValue,
    location: review.location,
    overallRating: review.overallRating,
    comment: review.comment,
    status: review.status,
    createdAt: review.createdAt?.toISOString?.() ?? review.createdAt,
    updatedAt: review.updatedAt?.toISOString?.() ?? review.updatedAt,
  }
}

export function createReviewsRouter(prisma) {
  const router = Router()

  router.get(
    "/universities/:universityId",
    asyncHandler(async (req, res) => {
      const universityId = parsePositiveId(req.params.universityId, "university id")
      const reviews = await prisma.universityReview.findMany({
        where: { universityId, status: "approved" },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      })

      const count = reviews.length
      const average = count
        ? Math.round((reviews.reduce((sum, item) => sum + item.overallRating, 0) / count) * 10) / 10
        : null

      res.json({ data: reviews.map(mapReview), meta: { count, average } })
    }),
  )

  router.post(
    "/universities/:universityId",
    requireStudent(prisma),
    asyncHandler(async (req, res) => {
      const universityId = parsePositiveId(req.params.universityId, "university id")
      const university = await prisma.university.findUnique({ where: { id: universityId } })

      if (!university) {
        throw new ApiError(404, "University not found")
      }

      const data = validateReview(req.body)
      const review = await prisma.universityReview.create({
        data: {
          ...data,
          universityId,
          userId: req.user.id,
          status: "approved",
        },
        include: { user: { select: { id: true, name: true } } },
      })

      res.status(201).json({ data: mapReview(review) })
    }),
  )

  router.get(
    "/me",
    requireStudent(prisma),
    asyncHandler(async (req, res) => {
      const reviews = await prisma.universityReview.findMany({
        where: { userId: req.user.id },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { updatedAt: "desc" },
      })

      res.json({ data: reviews.map(mapReview) })
    }),
  )

  router.patch(
    "/:id",
    requireStudent(prisma),
    asyncHandler(async (req, res) => {
      const id = parsePositiveId(req.params.id)
      const existing = await prisma.universityReview.findFirst({ where: { id, userId: req.user.id } })

      if (!existing) {
        throw new ApiError(404, "Review not found")
      }

      const data = validateReview(req.body)
      const review = await prisma.universityReview.update({
        where: { id },
        data,
        include: { user: { select: { id: true, name: true } } },
      })

      res.json({ data: mapReview(review) })
    }),
  )

  router.delete(
    "/:id",
    requireStudent(prisma),
    asyncHandler(async (req, res) => {
      const id = parsePositiveId(req.params.id)
      const existing = await prisma.universityReview.findFirst({ where: { id, userId: req.user.id } })

      if (!existing) {
        throw new ApiError(404, "Review not found")
      }

      try {
        await prisma.universityReview.delete({ where: { id } })
      } catch (error) {
        if (!isPrismaMissingRecord(error)) {
          throw error
        }
      }

      res.json({ data: { ok: true } })
    }),
  )

  return router
}

export { mapReview }
