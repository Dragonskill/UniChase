import { Router } from "express"
import { ApiError, asyncHandler } from "../errors.js"
import { mapStudentCouncilForClient, mapUniversityForClient } from "../mappers/universityMapper.js"
import {
  buildUniversityOrder,
  buildUniversityWhere,
  filterUniversitiesInMemory,
  parsePositiveId,
} from "../universityQuery.js"
import { parseCompareQuery, parseUniversityQuery, recommendationSchema, validateBody } from "../validation.js"
import { scoreUniversities } from "../recommendations.js"

const defaultOrder = buildUniversityOrder("qsRank")
const universityInclude = {
  studentCouncil: { include: { roles: { orderBy: [{ status: "asc" }, { roleTitle: "asc" }] } } },
}

export function createUniversityRouter(prisma) {
  const router = Router()

  const listUniversities = asyncHandler(async (req, res) => {
    const filters = parseUniversityQuery(req.query)
    const universities = await prisma.university.findMany({
      where: buildUniversityWhere(filters),
      orderBy: buildUniversityOrder(filters.sort),
      include: universityInclude,
    })
    const filteredUniversities = filterUniversitiesInMemory(universities, filters)

    res.json({
      data: filteredUniversities.map(mapUniversityForClient),
      count: filteredUniversities.length,
    })
  })

  router.get("/", listUniversities)
  router.get("/search", listUniversities)
  router.get("/filter", listUniversities)

  router.get(
    "/compare",
    asyncHandler(async (req, res) => {
      const { ids } = parseCompareQuery(req.query)
      const universities = await prisma.university.findMany({
        where: { id: { in: ids } },
        orderBy: defaultOrder,
        include: universityInclude,
      })

      res.json({
        data: ids
          .map((id) => universities.find((university) => university.id === id))
          .filter(Boolean)
          .map(mapUniversityForClient),
      })
    }),
  )

  router.post(
    "/recommendations",
    validateBody(recommendationSchema),
    asyncHandler(async (req, res) => {
      const universities = await prisma.university.findMany({ orderBy: defaultOrder })
      const recommendations = scoreUniversities(universities, req.body)

      await prisma.recommendationPreference.create({
        data: {
          preferredMajor: req.body.preferredMajor,
          preferredCity: req.body.preferredCity,
          language: req.body.language || (req.body.englishRequired ? "English" : null),
          dormitoryRequired: req.body.dormitoryRequired,
          scholarshipPreferred: req.body.scholarshipPreferred,
          level: req.body.level,
          rankingMin: req.body.rankingMin,
          rankingMax: req.body.rankingMax,
          tuitionMin: req.body.tuitionMin,
          tuitionMax: req.body.tuitionMax,
          results: recommendations.map((item) => ({
            universityId: item.university.id,
            score: item.score,
            reasons: item.reasons,
          })),
        },
      })

      res.json({
        data: recommendations.map((item) => ({
          university: mapUniversityForClient(item.university),
          score: item.score,
          reasons: item.reasons,
        })),
      })
    }),
  )

  router.get(
    "/:idOrSlug/student-council",
    asyncHandler(async (req, res) => {
      const identifier = req.params.idOrSlug
      const university = /^\d+$/.test(identifier)
        ? await prisma.university.findUnique({ where: { id: parsePositiveId(identifier) } })
        : await prisma.university.findUnique({ where: { slug: identifier } })

      if (!university) {
        throw new ApiError(404, "University not found")
      }

      const council = await prisma.studentCouncil.findUnique({
        where: { universityId: university.id },
        include: {
          roles: { orderBy: [{ status: "asc" }, { roleTitle: "asc" }] },
          university: { select: { id: true, name: true, slug: true, city: true } },
        },
      })

      if (!council) {
        throw new ApiError(404, "Student council not found")
      }

      res.json({ data: mapStudentCouncilForClient(council) })
    }),
  )

  router.get(
    "/:idOrSlug",
    asyncHandler(async (req, res) => {
      const identifier = req.params.idOrSlug
      const university = /^\d+$/.test(identifier)
        ? await prisma.university.findUnique({ where: { id: parsePositiveId(identifier) }, include: universityInclude })
        : await prisma.university.findUnique({ where: { slug: identifier }, include: universityInclude })

      if (!university) {
        throw new ApiError(404, "University not found")
      }

      res.json({ data: mapUniversityForClient(university) })
    }),
  )

  return router
}
