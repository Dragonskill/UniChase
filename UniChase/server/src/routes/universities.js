import { Router } from "express"
import { mapProgram } from "./programs.js"
import { ApiError, asyncHandler } from "../errors.js"
import { mapStudentCouncilForClient, mapUniversityForClient } from "../mappers/universityMapper.js"
import {
  buildUniversityOrder,
  buildUniversityWhere,
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
    const page = Number(req.query.page || 1)
    const limit = Number(req.query.limit || 12)
    if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw new ApiError(400, "Invalid page or limit (maximum 100)")
    const where = buildUniversityWhere(filters)
    const and = where.AND || []
    const search = filters.q || filters.search || filters.name || ""
    for (const token of search.split(/\s+/).filter(Boolean)) {
      and.push({ OR: [
        ...["name", "koreanName", "city", "country"].map(field => ({ [field]: { contains: token, mode: "insensitive" } })),
        { degreePrograms: { some: { name: { contains: token, mode: "insensitive" } } } },
        { programs: { has: token } }, { tags: { has: token } },
        { studentCouncil: { is: { OR: [{ name: { contains: token, mode: "insensitive" } }, { officialName: { contains: token, mode: "insensitive" } }] } } },
        ...( /^#?\d+$/.test(token) ? [{ qsRanking: Number(token.replace("#", "")) }] : [] ),
        ...(/^english$/i.test(token) ? [{ languagesOfInstruction: { has: "English" } }] : []),
      ] })
    }
    if (filters.major) and.push({ OR: [{ programs: { has: filters.major } }, { degreePrograms: { some: { name: { contains: filters.major, mode: "insensitive" } } } }] })
    const query = and.length ? { AND: and } : {}
    const [total, universities] = await prisma.$transaction([
      prisma.university.count({ where: query }),
      prisma.university.findMany({ where: query, orderBy: buildUniversityOrder(filters.sort), skip: (page - 1) * limit, take: limit }),
    ])
    res.json({ data: universities.map(mapUniversityForClient), count: total, meta: { total, page, limit, pages: Math.ceil(total / limit) } })
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
      const universities = await prisma.university.findMany({ orderBy: defaultOrder, take: 1000 })
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
          disadvantages: item.disadvantages || [],
          })),
        },
      })

      res.json({
        data: recommendations.map((item) => ({
          university: mapUniversityForClient(item.university),
          score: item.score,
          reasons: item.reasons,
          disadvantages: item.disadvantages || [],
        })),
      })
    }),
  )

  router.get(
    "/:idOrSlug/programs",
    asyncHandler(async (req, res) => {
      const identifier = req.params.idOrSlug
      const university = /^\d+$/.test(identifier)
        ? await prisma.university.findUnique({
            where: { id: parsePositiveId(identifier) },
            include: { degreePrograms: { orderBy: { name: "asc" } } },
          })
        : await prisma.university.findUnique({
            where: { slug: identifier },
            include: { degreePrograms: { orderBy: { name: "asc" } } },
          })

      if (!university) {
        throw new ApiError(404, "University not found")
      }

      res.json({ data: university.degreePrograms.map((program) => mapProgram({ ...program, university })) })
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
