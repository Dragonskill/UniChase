import { Router } from "express"
import { ApiError, asyncHandler } from "../errors.js"
import { mapStudentCouncilForClient } from "../mappers/universityMapper.js"
import { parsePositiveId } from "../universityQuery.js"

const councilInclude = {
  roles: { orderBy: [{ status: "asc" }, { roleTitle: "asc" }] },
  university: { select: { id: true, name: true, slug: true, city: true } },
}

export function createStudentCouncilRouter(prisma) {
  const router = Router()

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const councils = await prisma.studentCouncil.findMany({
        include: councilInclude,
        orderBy: { name: "asc" },
      })

      res.json({
        data: councils.map(mapStudentCouncilForClient),
        count: councils.length,
      })
    }),
  )

  router.get(
    "/:id",
    asyncHandler(async (req, res) => {
      const council = await prisma.studentCouncil.findUnique({
        where: { id: parsePositiveId(req.params.id) },
        include: councilInclude,
      })

      if (!council) {
        throw new ApiError(404, "Student council not found")
      }

      res.json({ data: mapStudentCouncilForClient(council) })
    }),
  )

  return router
}
