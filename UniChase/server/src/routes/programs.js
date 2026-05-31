import { Router } from "express"
import { z } from "zod"
import { ApiError, asyncHandler } from "../errors.js"
import { mapUniversityForClient } from "../mappers/universityMapper.js"

const querySchema = z
  .object({
    q: z.string().trim().max(120).optional(),
    universityId: z.coerce.number().int().positive().optional(),
    degreeLevel: z.string().trim().max(80).optional(),
    language: z.string().trim().max(80).optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  })
  .strip()

function mapProgram(program) {
  return {
    id: program.id,
    universityId: program.universityId,
    slug: program.slug,
    name: program.name,
    degreeLevel: program.degreeLevel,
    languageOfInstruction: program.languageOfInstruction,
    tuition: {
      min: program.tuitionMin,
      max: program.tuitionMax,
      currency: program.tuitionCurrency,
    },
    duration: program.duration,
    requirements: program.requirements,
    requiredDocuments: program.requiredDocuments,
    applicationPeriod: program.applicationPeriod,
    careerOutcomes: program.careerOutcomes,
    officialLink: program.officialLink,
    university: program.university ? mapUniversityForClient(program.university) : undefined,
    createdAt: program.createdAt?.toISOString?.() ?? program.createdAt,
    updatedAt: program.updatedAt?.toISOString?.() ?? program.updatedAt,
  }
}

export function createProgramRouter(prisma) {
  const router = Router()

  const listPrograms = asyncHandler(async (req, res) => {
      const parsed = querySchema.safeParse(req.query)

      if (!parsed.success) {
        throw new ApiError(400, "Invalid program query")
      }

      const { q, universityId, degreeLevel, language, limit = 60 } = parsed.data
      const where = {}

      if (universityId) {
        where.universityId = universityId
      }

      if (degreeLevel) {
        where.degreeLevel = { contains: degreeLevel, mode: "insensitive" }
      }

      if (language) {
        where.languageOfInstruction = { contains: language, mode: "insensitive" }
      }

      if (q) {
        where.OR = [
          { name: { contains: q, mode: "insensitive" } },
          { degreeLevel: { contains: q, mode: "insensitive" } },
          { languageOfInstruction: { contains: q, mode: "insensitive" } },
          { university: { name: { contains: q, mode: "insensitive" } } },
        ]
      }

      const programs = await prisma.program.findMany({
        where,
        include: { university: true },
        orderBy: [{ university: { qsRanking: "asc" } }, { name: "asc" }],
        take: limit,
      })

      res.json({ data: programs.map(mapProgram), count: programs.length })
  })

  router.get("/", listPrograms)
  router.get("/search", listPrograms)

  router.get(
    "/:slug",
    asyncHandler(async (req, res) => {
      const program = await prisma.program.findUnique({
        where: { slug: req.params.slug },
        include: { university: true },
      })

      if (!program) {
        throw new ApiError(404, "Program not found")
      }

      res.json({ data: mapProgram(program) })
    }),
  )

  return router
}

export { mapProgram }
