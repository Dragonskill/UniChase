import { Router } from "express"
import { requireAdmin } from "../auth.js"
import { ApiError, asyncHandler, isPrismaMissingRecord } from "../errors.js"
import { mapUniversityForClient } from "../mappers/universityMapper.js"
import { buildUniversityWhere, parsePositiveId } from "../universityQuery.js"
import {
  parseUniversityQuery,
  universityCreateSchema,
  universityUpdateSchema,
  validateBody,
} from "../validation.js"

const defaultOrder = [{ qsRanking: "asc" }, { name: "asc" }]

export function createAdminUniversityRouter(prisma) {
  const router = Router()

  router.use(requireAdmin(prisma))

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const filters = parseUniversityQuery(req.query)
      const universities = await prisma.university.findMany({
        where: buildUniversityWhere(filters),
        orderBy: defaultOrder,
      })

      res.json({
        data: universities.map(mapUniversityForClient),
        count: universities.length,
      })
    }),
  )

  router.post(
    "/",
    validateBody(universityCreateSchema),
    asyncHandler(async (req, res) => {
      const university = await prisma.university.create({ data: req.body })

      res.status(201).json({ data: mapUniversityForClient(university) })
    }),
  )

  router.put(
    "/:id",
    validateBody(universityUpdateSchema),
    asyncHandler(async (req, res) => {
      const id = parsePositiveId(req.params.id)

      try {
        const university = await prisma.university.update({
          where: { id },
          data: req.body,
        })

        res.json({ data: mapUniversityForClient(university) })
      } catch (error) {
        if (isPrismaMissingRecord(error)) {
          throw new ApiError(404, "University not found")
        }

        throw error
      }
    }),
  )

  router.delete(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = parsePositiveId(req.params.id)

      try {
        const university = await prisma.university.delete({ where: { id } })

        res.json({
          data: mapUniversityForClient(university),
          message: "University deleted",
        })
      } catch (error) {
        if (isPrismaMissingRecord(error)) {
          throw new ApiError(404, "University not found")
        }

        throw error
      }
    }),
  )

  return router
}
