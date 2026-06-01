import { Router } from "express"
import { requireAdmin } from "../auth.js"
import { ApiError, asyncHandler, isPrismaMissingRecord } from "../errors.js"
import {
  mapStudentCouncilForClient,
  mapStudentCouncilRoleForClient,
  mapUniversityForClient,
} from "../mappers/universityMapper.js"
import { parsePositiveId } from "../universityQuery.js"
import {
  moderatorProfileSchema,
  studentCouncilCreateSchema,
  studentCouncilRoleCreateSchema,
  studentCouncilRoleUpdateSchema,
  studentCouncilUpdateSchema,
  universityCreateSchema,
  universityUpdateSchema,
  validateBody,
} from "../validation.js"

const councilInclude = {
  roles: { orderBy: [{ status: "asc" }, { roleTitle: "asc" }] },
  university: { select: { id: true, name: true, slug: true, city: true } },
}

const universityInclude = {
  studentCouncil: { include: { roles: { orderBy: [{ status: "asc" }, { roleTitle: "asc" }] } } },
}

function mapModeratorProfile(profile) {
  return {
    id: profile.id,
    adminUserId: profile.adminUserId,
    displayName: profile.displayName,
    description: profile.description,
    defaultRole: profile.defaultRole,
    avatarUrl: profile.avatarUrl,
    contactEmail: profile.contactEmail,
    createdAt: profile.createdAt?.toISOString?.() ?? profile.createdAt,
    updatedAt: profile.updatedAt?.toISOString?.() ?? profile.updatedAt,
  }
}

export function createModeratorRouter(prisma) {
  const router = Router()

  router.use(requireAdmin(prisma))

  router.post(
    "/universities",
    validateBody(universityCreateSchema),
    asyncHandler(async (req, res) => {
      const university = await prisma.university.create({
        data: req.body,
        include: universityInclude,
      })

      res.status(201).json({ data: mapUniversityForClient(university) })
    }),
  )

  router.patch(
    "/universities/:id",
    validateBody(universityUpdateSchema),
    asyncHandler(async (req, res) => {
      const university = await prisma.university.update({
        where: { id: parsePositiveId(req.params.id) },
        data: req.body,
        include: universityInclude,
      })

      res.json({ data: mapUniversityForClient(university) })
    }),
  )

  router.post(
    "/student-councils",
    validateBody(studentCouncilCreateSchema),
    asyncHandler(async (req, res) => {
      const council = await prisma.studentCouncil.upsert({
        where: { universityId: req.body.universityId },
        update: req.body,
        create: req.body,
        include: councilInclude,
      })

      res.status(201).json({ data: mapStudentCouncilForClient(council) })
    }),
  )

  router.patch(
    "/student-councils/:id",
    validateBody(studentCouncilUpdateSchema),
    asyncHandler(async (req, res) => {
      const council = await prisma.studentCouncil.update({
        where: { id: parsePositiveId(req.params.id) },
        data: req.body,
        include: councilInclude,
      })

      res.json({ data: mapStudentCouncilForClient(council) })
    }),
  )

  router.delete(
    "/student-councils/:id",
    asyncHandler(async (req, res) => {
      try {
        const council = await prisma.studentCouncil.delete({
          where: { id: parsePositiveId(req.params.id) },
          include: councilInclude,
        })

        res.json({ data: mapStudentCouncilForClient(council), message: "Student council deleted" })
      } catch (error) {
        if (isPrismaMissingRecord(error)) {
          throw new ApiError(404, "Student council not found")
        }

        throw error
      }
    }),
  )

  router.post(
    "/student-council-roles",
    validateBody(studentCouncilRoleCreateSchema),
    asyncHandler(async (req, res) => {
      const data = {
        ...req.body,
        adminUserId: req.body.adminUserId === null ? null : req.body.adminUserId,
      }
      const role = await prisma.studentCouncilRole.create({ data })

      res.status(201).json({ data: mapStudentCouncilRoleForClient(role) })
    }),
  )

  router.patch(
    "/student-council-roles/:id",
    validateBody(studentCouncilRoleUpdateSchema),
    asyncHandler(async (req, res) => {
      const role = await prisma.studentCouncilRole.update({
        where: { id: parsePositiveId(req.params.id) },
        data: req.body,
      })

      res.json({ data: mapStudentCouncilRoleForClient(role) })
    }),
  )

  router.delete(
    "/student-council-roles/:id",
    asyncHandler(async (req, res) => {
      try {
        const role = await prisma.studentCouncilRole.delete({
          where: { id: parsePositiveId(req.params.id) },
        })

        res.json({ data: mapStudentCouncilRoleForClient(role), message: "Student council role deleted" })
      } catch (error) {
        if (isPrismaMissingRecord(error)) {
          throw new ApiError(404, "Student council role not found")
        }

        throw error
      }
    }),
  )

  router.post(
    "/profile",
    validateBody(moderatorProfileSchema),
    asyncHandler(async (req, res) => {
      if (!req.body.displayName) {
        req.body.displayName = req.admin.email
      }

      const profile = await prisma.moderatorProfile.upsert({
        where: { adminUserId: req.admin.id },
        update: req.body,
        create: {
          ...req.body,
          adminUserId: req.admin.id,
        },
      })

      res.status(201).json({ data: mapModeratorProfile(profile) })
    }),
  )

  router.patch(
    "/profile",
    validateBody(moderatorProfileSchema),
    asyncHandler(async (req, res) => {
      const profile = await prisma.moderatorProfile.upsert({
        where: { adminUserId: req.admin.id },
        update: req.body,
        create: {
          displayName: req.body.displayName || req.admin.email,
          description: req.body.description,
          defaultRole: req.body.defaultRole,
          avatarUrl: req.body.avatarUrl,
          contactEmail: req.body.contactEmail,
          adminUserId: req.admin.id,
        },
      })

      res.json({ data: mapModeratorProfile(profile) })
    }),
  )

  return router
}
