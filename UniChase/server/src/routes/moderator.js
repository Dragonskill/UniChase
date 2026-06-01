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
  internalNoteSchema,
  moderationStatusSchema,
  moderatorProfileSchema,
  moderatorAnnouncementSchema,
  moderatorRoleSchema,
  studentCouncilCreateSchema,
  studentCouncilRoleCreateSchema,
  studentCouncilRoleUpdateSchema,
  studentCouncilUpdateSchema,
  universityCreateSchema,
  universityImageUpdateSchema,
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

const rolePermissions = {
  admin: ["all"],
  moderator: ["community", "reviews", "reports", "notifications", "analytics"],
  university_editor: ["universities", "student-councils", "verification"],
  content_editor: ["content", "notifications"],
  community_moderator: ["community", "reports"],
}

function canAccess(admin, permission) {
  const permissions = rolePermissions[admin.role || "admin"] || []
  return permissions.includes("all") || permissions.includes(permission)
}

function requirePermission(req, permission) {
  if (!canAccess(req.admin, permission)) {
    throw new ApiError(403, "Moderator role does not allow this action")
  }
}

async function logActivity(prisma, req, data) {
  await prisma.moderatorActivityLog.create({
    data: {
      adminUserId: req.admin.id,
      actionType: data.actionType,
      targetEntity: data.targetEntity,
      targetEntityId: data.targetEntityId,
      previousStatus: data.previousStatus,
      newStatus: data.newStatus,
      metadata: data.metadata,
    },
  })
}

export function createModeratorRouter(prisma) {
  const router = Router()

  router.use(requireAdmin(prisma))

  router.get(
    "/queue",
    asyncHandler(async (req, res) => {
      requirePermission(req, "community")
      const [pendingPosts, reportedPosts, reportedComments, reports, studentCouncilChanges, brokenImages] = await Promise.all([
        prisma.communityPost.findMany({
          where: { status: "pending" },
          include: { author: { select: { id: true, name: true } }, university: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
        prisma.communityPost.findMany({
          where: { status: "reported" },
          include: { author: { select: { id: true, name: true } }, university: { select: { id: true, name: true } } },
          orderBy: { updatedAt: "desc" },
          take: 50,
        }),
        prisma.communityComment.findMany({
          where: { status: "reported" },
          include: { author: { select: { id: true, name: true } }, post: { select: { id: true, title: true } } },
          orderBy: { updatedAt: "desc" },
          take: 50,
        }),
        prisma.communityReport.findMany({
          where: { status: "pending" },
          include: {
            reporter: { select: { id: true, name: true } },
            post: { select: { id: true, title: true, status: true } },
            comment: { select: { id: true, content: true, status: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
        prisma.studentCouncilRole.findMany({
          where: { OR: [{ status: "pending" }, { verificationStatus: "needs verification" }] },
          include: { university: { select: { id: true, name: true } }, council: { select: { id: true, name: true } } },
          take: 50,
        }),
        prisma.university.findMany({
          where: { OR: [{ campusImageUrl: null }, { imageLastVerifiedAt: null }] },
          select: { id: true, name: true, campusImageUrl: true, imageLastVerifiedAt: true, officialWebsite: true },
          take: 50,
        }),
      ])

      res.json({
        data: {
          pendingPosts,
          reportedPosts,
          reportedComments,
          pendingUniversityReviews: [],
          pendingStudentCouncilChanges: studentCouncilChanges,
          pendingUniversityDataChanges: [],
          verificationQueue: brokenImages,
          reports,
        },
      })
    }),
  )

  router.get(
    "/reports",
    asyncHandler(async (req, res) => {
      requirePermission(req, "reports")
      const reports = await prisma.communityReport.findMany({
        include: {
          reporter: { select: { id: true, name: true, email: true } },
          post: { select: { id: true, title: true, status: true } },
          comment: { select: { id: true, content: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      })

      res.json({ data: reports })
    }),
  )

  router.patch(
    "/posts/:id/status",
    validateBody(moderationStatusSchema),
    asyncHandler(async (req, res) => {
      requirePermission(req, "community")
      const id = parsePositiveId(req.params.id)
      const existing = await prisma.communityPost.findUnique({ where: { id } })
      if (!existing) throw new ApiError(404, "Community post not found")

      const post = await prisma.communityPost.update({
        where: { id },
        data: {
          status: req.body.status || existing.status,
          pinned: req.body.pinned ?? existing.pinned,
          officialAnswer: req.body.officialAnswer ?? existing.officialAnswer,
        },
      })
      await logActivity(prisma, req, {
        actionType: "moderate_post",
        targetEntity: "CommunityPost",
        targetEntityId: id,
        previousStatus: existing.status,
        newStatus: post.status,
        metadata: { pinned: post.pinned, note: req.body.note },
      })

      res.json({ data: post })
    }),
  )

  router.patch(
    "/comments/:id/status",
    validateBody(moderationStatusSchema),
    asyncHandler(async (req, res) => {
      requirePermission(req, "community")
      const id = parsePositiveId(req.params.id)
      const existing = await prisma.communityComment.findUnique({ where: { id } })
      if (!existing) throw new ApiError(404, "Community comment not found")

      const comment = await prisma.communityComment.update({
        where: { id },
        data: {
          status: req.body.status || existing.status,
          official: req.body.official ?? existing.official,
        },
      })

      if (comment.official) {
        await prisma.communityPost.update({
          where: { id: comment.postId },
          data: { officialCommentId: comment.id, officialAnswer: comment.content },
        })
      }

      await logActivity(prisma, req, {
        actionType: "moderate_comment",
        targetEntity: "CommunityComment",
        targetEntityId: id,
        previousStatus: existing.status,
        newStatus: comment.status,
        metadata: { official: comment.official, note: req.body.note },
      })

      res.json({ data: comment })
    }),
  )

  router.patch(
    "/reviews/:id/status",
    validateBody(moderationStatusSchema),
    asyncHandler(async (req, res) => {
      requirePermission(req, "reviews")
      await logActivity(prisma, req, {
        actionType: "moderate_review",
        targetEntity: "Review",
        targetEntityId: parsePositiveId(req.params.id),
        newStatus: req.body.status,
        metadata: { note: req.body.note },
      })

      res.json({ data: { id: parsePositiveId(req.params.id), status: req.body.status } })
    }),
  )

  router.get(
    "/activity-logs",
    asyncHandler(async (req, res) => {
      requirePermission(req, "analytics")
      const logs = await prisma.moderatorActivityLog.findMany({
        include: { adminUser: { select: { id: true, email: true, role: true } } },
        orderBy: { createdAt: "desc" },
        take: 100,
      })

      res.json({ data: logs })
    }),
  )

  router.get(
    "/broken-links",
    asyncHandler(async (req, res) => {
      requirePermission(req, "verification")
      const universities = await prisma.university.findMany({
        where: { OR: [{ officialWebsite: "" }, { qsSourceUrl: null }] },
        select: { id: true, name: true, officialWebsite: true, qsSourceUrl: true },
        take: 100,
      })

      res.json({ data: universities })
    }),
  )

  router.get(
    "/broken-images",
    asyncHandler(async (req, res) => {
      requirePermission(req, "verification")
      const universities = await prisma.university.findMany({
        where: { OR: [{ campusImageUrl: null }, { logoUrl: null }, { imageLastVerifiedAt: null }] },
        select: { id: true, name: true, campusImageUrl: true, logoUrl: true, imageLastVerifiedAt: true },
        take: 100,
      })

      res.json({ data: universities })
    }),
  )

  router.patch(
    "/users/:id/role",
    validateBody(moderatorRoleSchema),
    asyncHandler(async (req, res) => {
      requirePermission(req, "all")
      const admin = await prisma.adminUser.update({
        where: { id: parsePositiveId(req.params.id) },
        data: { role: req.body.role },
        select: { id: true, email: true, role: true },
      })

      await logActivity(prisma, req, {
        actionType: "update_admin_role",
        targetEntity: "AdminUser",
        targetEntityId: admin.id,
        newStatus: admin.role,
      })

      res.json({ data: admin })
    }),
  )

  router.post(
    "/internal-notes",
    validateBody(internalNoteSchema),
    asyncHandler(async (req, res) => {
      requirePermission(req, "community")
      const note = await prisma.moderatorInternalNote.create({
        data: { ...req.body, adminUserId: req.admin.id },
      })

      await logActivity(prisma, req, {
        actionType: "internal_note",
        targetEntity: req.body.targetEntity,
        targetEntityId: req.body.targetEntityId,
      })

      res.status(201).json({ data: note })
    }),
  )

  router.post(
    "/notifications/announcement",
    validateBody(moderatorAnnouncementSchema),
    asyncHandler(async (req, res) => {
      requirePermission(req, "notifications")
      const users = req.body.userIds?.length
        ? await prisma.studentUser.findMany({ where: { id: { in: req.body.userIds } }, select: { id: true } })
        : await prisma.studentUser.findMany({ select: { id: true } })

      const notifications = await prisma.notification.createMany({
        data: users.map((user) => ({
          userId: user.id,
          type: req.body.type,
          title: req.body.title,
          message: req.body.message,
          linkUrl: req.body.linkUrl,
          priority: req.body.priority,
        })),
      })

      await logActivity(prisma, req, {
        actionType: "send_announcement",
        targetEntity: "Notification",
        metadata: { count: notifications.count, title: req.body.title },
      })

      res.status(201).json({ data: { created: notifications.count } })
    }),
  )

  router.get(
    "/analytics/overview",
    asyncHandler(async (req, res) => {
      requirePermission(req, "analytics")
      const [events, users, posts, applications, documents] = await Promise.all([
        prisma.analyticsEvent.count(),
        prisma.studentUser.count(),
        prisma.communityPost.count(),
        prisma.userApplication.groupBy({ by: ["status"], _count: { _all: true } }),
        prisma.userDocument.groupBy({ by: ["status"], _count: { _all: true } }),
      ])

      res.json({ data: { events, users, posts, applicationStatusCounts: applications, documentStatusCounts: documents } })
    }),
  )

  router.get(
    "/analytics/top-universities",
    asyncHandler(async (req, res) => {
      requirePermission(req, "analytics")
      const views = await prisma.analyticsEvent.groupBy({
        by: ["entityId"],
        where: { eventType: { in: ["university_view", "university_saved", "university_compared"] }, entityType: "university", entityId: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { entityId: "desc" } },
        take: 20,
      })
      const universities = await prisma.university.findMany({
        where: { id: { in: views.map((item) => item.entityId).filter(Boolean) } },
        select: { id: true, name: true, city: true, qsRanking: true },
      })

      res.json({
        data: views.map((item) => ({
          university: universities.find((university) => university.id === item.entityId),
          count: item._count._all,
        })),
      })
    }),
  )

  router.get(
    "/analytics/searches",
    asyncHandler(async (req, res) => {
      requirePermission(req, "analytics")
      const searches = await prisma.analyticsEvent.findMany({
        where: { eventType: { in: ["search", "filter_used"] } },
        orderBy: { createdAt: "desc" },
        take: 100,
      })

      res.json({ data: searches })
    }),
  )

  router.get(
    "/analytics/users",
    asyncHandler(async (req, res) => {
      requirePermission(req, "analytics")
      const users = await prisma.studentUser.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          _count: {
            select: {
              communityPosts: true,
              communityComments: true,
              applications: true,
              documents: true,
              calendarEvents: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      })

      res.json({ data: users })
    }),
  )

  router.get(
    "/analytics/export",
    asyncHandler(async (req, res) => {
      requirePermission(req, "analytics")
      const events = await prisma.analyticsEvent.findMany({ orderBy: { createdAt: "desc" }, take: 1000 })
      const csv = [
        "id,eventType,entityType,entityId,userId,sessionId,createdAt",
        ...events.map((event) =>
          [event.id, event.eventType, event.entityType || "", event.entityId || "", event.userId || "", event.sessionId || "", event.createdAt.toISOString()]
            .map((value) => `"${String(value).replace(/"/g, '""')}"`)
            .join(","),
        ),
      ].join("\n")

      res.setHeader("Content-Type", "text/csv; charset=utf-8")
      res.setHeader("Content-Disposition", "attachment; filename=unichase-analytics.csv")
      res.send(csv)
    }),
  )

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

  router.patch(
    "/universities/:id/images",
    validateBody(universityImageUpdateSchema),
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
