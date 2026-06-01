import { Router } from "express"
import { requireStudent } from "../auth.js"
import { ApiError, asyncHandler, isPrismaMissingRecord } from "../errors.js"
import { mapUniversityForClient } from "../mappers/universityMapper.js"
import { parsePositiveId } from "../universityQuery.js"
import {
  applicationCreateSchema,
  applicationUpdateSchema,
  calendarEventCreateSchema,
  calendarEventUpdateSchema,
  checklistPatchSchema,
  onboardingPatchSchema,
  onboardingSchema,
  savedUniversitySchema,
  userDeadlineSchema,
  userDocumentCreateSchema,
  userDocumentUpdateSchema,
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

function mapApplication(item) {
  return {
    id: item.id,
    userId: item.userId,
    universityId: item.universityId,
    university: item.university ? mapUniversityForClient(item.university) : undefined,
    programId: item.programId,
    status: item.status,
    intake: item.intake,
    applicationDeadline: item.applicationDeadline,
    submittedDate: item.submittedDate,
    resultDate: item.resultDate,
    notes: item.notes,
    priority: item.priority,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

function mapCalendarEvent(event) {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    eventType: event.eventType,
    startDate: event.startDate,
    endDate: event.endDate,
    allDay: event.allDay,
    universityId: event.universityId,
    university: event.university ? { id: event.university.id, name: event.university.name, slug: event.university.slug } : null,
    programId: event.programId,
    applicationId: event.applicationId,
    checklistItemId: event.checklistItemId,
    roadmapStepId: event.roadmapStepId,
    status: event.status,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  }
}

function dateToIcs(value) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")
}

function escapeIcs(value = "") {
  return String(value).replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n")
}

function eventsToIcs(events) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//UniChase//Student Calendar//EN",
  ]

  events.forEach((event) => {
    lines.push(
      "BEGIN:VEVENT",
      `UID:unichase-${event.id}@uni-chase`,
      `DTSTAMP:${dateToIcs(new Date())}`,
      `DTSTART:${dateToIcs(event.startDate)}`,
      event.endDate ? `DTEND:${dateToIcs(event.endDate)}` : "",
      `SUMMARY:${escapeIcs(event.title)}`,
      event.description ? `DESCRIPTION:${escapeIcs(event.description)}` : "",
      `CATEGORIES:${escapeIcs(event.eventType)}`,
      "END:VEVENT",
    )
  })

  lines.push("END:VCALENDAR")
  return lines.filter(Boolean).join("\r\n")
}

async function createNotification(prisma, data) {
  return prisma.notification.create({ data }).catch(() => null)
}

async function upsertApplicationDeadlineEvent(prisma, application) {
  if (!application.applicationDeadline) {
    return
  }

  const existing = await prisma.calendarEvent.findFirst({
    where: { userId: application.userId, applicationId: application.id, eventType: "application_deadline" },
  })

  if (existing) {
    await prisma.calendarEvent.update({
      where: { id: existing.id },
      data: {
        startDate: application.applicationDeadline,
        title: `${application.university?.name || "Application"} deadline`,
        universityId: application.universityId,
      },
    })
    return
  }

  await prisma.calendarEvent.create({
    data: {
      userId: application.userId,
      title: `${application.university?.name || "Application"} deadline`,
      description: `Application deadline for ${application.university?.name || "selected university"}.`,
      eventType: "application_deadline",
      startDate: application.applicationDeadline,
      allDay: true,
      universityId: application.universityId,
      applicationId: application.id,
      status: "upcoming",
    },
  })
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

  router.get(
    "/onboarding",
    asyncHandler(async (req, res) => {
      const preference = await prisma.userOnboardingPreference.findUnique({ where: { userId: req.user.id } })
      res.json({ data: preference })
    }),
  )

  router.post(
    "/onboarding",
    validateBody(onboardingSchema),
    asyncHandler(async (req, res) => {
      const preference = await prisma.userOnboardingPreference.upsert({
        where: { userId: req.user.id },
        update: req.body,
        create: { ...req.body, userId: req.user.id },
      })

      res.status(201).json({ data: preference })
    }),
  )

  router.patch(
    "/onboarding",
    validateBody(onboardingPatchSchema),
    asyncHandler(async (req, res) => {
      const preference = await prisma.userOnboardingPreference.upsert({
        where: { userId: req.user.id },
        update: req.body,
        create: { ...req.body, userId: req.user.id },
      })

      res.json({ data: preference })
    }),
  )

  router.post(
    "/onboarding/generate-dashboard",
    asyncHandler(async (req, res) => {
      const preference = await prisma.userOnboardingPreference.findUnique({ where: { userId: req.user.id } })
      const recommended = await prisma.university.findMany({
        where: {
          ...(preference?.preferredCity ? { city: { contains: preference.preferredCity, mode: "insensitive" } } : {}),
          ...(preference?.desiredMajor ? { programs: { hasSome: [preference.desiredMajor] } } : {}),
          ...(preference?.qsRankMax ? { qsRanking: { lte: preference.qsRankMax } } : {}),
        },
        orderBy: [{ qsRanking: "asc" }, { name: "asc" }],
        take: 4,
      })

      const fallback = recommended.length > 0 ? recommended : await prisma.university.findMany({ orderBy: { qsRanking: "asc" }, take: 4 })
      await Promise.all(
        fallback.slice(0, 3).map((university) =>
          prisma.savedUniversity.upsert({
            where: { userId_universityId: { userId: req.user.id, universityId: university.id } },
            update: {},
            create: { userId: req.user.id, universityId: university.id, notes: "Suggested from onboarding" },
          }),
        ),
      )

      const checklistTitles = [
        "Confirm target intake",
        "Prepare passport and transcripts",
        "Shortlist 3 universities",
        "Check visa document requirements",
      ]
      const existingChecklist = await prisma.checklistItem.count({ where: { userId: req.user.id } })
      if (existingChecklist === 0) {
        await prisma.checklistItem.createMany({
          data: checklistTitles.map((title) => ({ userId: req.user.id, title, completed: false })),
        })
      }

      await prisma.userOnboardingPreference.upsert({
        where: { userId: req.user.id },
        update: { onboardingCompleted: true },
        create: { userId: req.user.id, onboardingCompleted: true },
      })

      await createNotification(prisma, {
        userId: req.user.id,
        type: "dashboard_setup",
        title: "Dashboard setup is ready",
        message: "UniChase created starter saved universities, checklist tasks, and recommendations from your onboarding answers.",
        linkUrl: "/dashboard",
      })

      res.json({ data: { recommendedUniversities: fallback.map(mapUniversityForClient), checklistCreated: existingChecklist === 0 } })
    }),
  )

  router.get(
    "/applications",
    asyncHandler(async (req, res) => {
      const applications = await prisma.userApplication.findMany({
        where: { userId: req.user.id },
        include: { university: true },
        orderBy: [{ updatedAt: "desc" }],
      })

      res.json({ data: applications.map(mapApplication) })
    }),
  )

  router.post(
    "/applications",
    validateBody(applicationCreateSchema),
    asyncHandler(async (req, res) => {
      const application = await prisma.userApplication.create({
        data: { ...req.body, userId: req.user.id },
        include: { university: true },
      })

      await upsertApplicationDeadlineEvent(prisma, application)
      await createNotification(prisma, {
        userId: req.user.id,
        type: "application_status_changed",
        title: "Application tracker started",
        message: `${application.university.name} is now tracked as ${application.status}.`,
        relatedEntityType: "application",
        relatedEntityId: application.id,
        linkUrl: "/dashboard",
      })

      res.status(201).json({ data: mapApplication(application) })
    }),
  )

  router.get(
    "/applications/:id",
    asyncHandler(async (req, res) => {
      const application = await prisma.userApplication.findFirst({
        where: { id: parsePositiveId(req.params.id), userId: req.user.id },
        include: { university: true },
      })

      if (!application) throw new ApiError(404, "Application not found")
      res.json({ data: mapApplication(application) })
    }),
  )

  router.patch(
    "/applications/:id",
    validateBody(applicationUpdateSchema),
    asyncHandler(async (req, res) => {
      const id = parsePositiveId(req.params.id)
      const existing = await prisma.userApplication.findFirst({ where: { id, userId: req.user.id }, include: { university: true } })
      if (!existing) throw new ApiError(404, "Application not found")

      const application = await prisma.userApplication.update({
        where: { id },
        data: req.body,
        include: { university: true },
      })

      await upsertApplicationDeadlineEvent(prisma, application)
      if (req.body.status && req.body.status !== existing.status) {
        await createNotification(prisma, {
          userId: req.user.id,
          type: "application_status_changed",
          title: "Application status updated",
          message: `${application.university.name} changed from ${existing.status} to ${application.status}.`,
          relatedEntityType: "application",
          relatedEntityId: application.id,
          linkUrl: "/dashboard",
        })
      }

      res.json({ data: mapApplication(application) })
    }),
  )

  router.delete(
    "/applications/:id",
    asyncHandler(async (req, res) => {
      const id = parsePositiveId(req.params.id)
      await prisma.userApplication.deleteMany({ where: { id, userId: req.user.id } })
      res.json({ data: { ok: true } })
    }),
  )

  router.get(
    "/documents",
    asyncHandler(async (req, res) => {
      const documents = await prisma.userDocument.findMany({
        where: { userId: req.user.id },
        orderBy: [{ updatedAt: "desc" }],
      })

      res.json({ data: documents })
    }),
  )

  router.post(
    "/documents",
    validateBody(userDocumentCreateSchema),
    asyncHandler(async (req, res) => {
      const document = await prisma.userDocument.create({ data: { ...req.body, userId: req.user.id } })
      res.status(201).json({ data: document })
    }),
  )

  router.get(
    "/documents/:id",
    asyncHandler(async (req, res) => {
      const document = await prisma.userDocument.findFirst({ where: { id: parsePositiveId(req.params.id), userId: req.user.id } })
      if (!document) throw new ApiError(404, "Document not found")
      res.json({ data: document })
    }),
  )

  router.patch(
    "/documents/:id",
    validateBody(userDocumentUpdateSchema),
    asyncHandler(async (req, res) => {
      const id = parsePositiveId(req.params.id)
      const result = await prisma.userDocument.updateMany({ where: { id, userId: req.user.id }, data: req.body })
      if (result.count === 0) throw new ApiError(404, "Document not found")
      const document = await prisma.userDocument.findFirst({ where: { id, userId: req.user.id } })
      res.json({ data: document })
    }),
  )

  router.delete(
    "/documents/:id",
    asyncHandler(async (req, res) => {
      await prisma.userDocument.deleteMany({ where: { id: parsePositiveId(req.params.id), userId: req.user.id } })
      res.json({ data: { ok: true } })
    }),
  )

  router.post(
    "/documents/:id/upload",
    asyncHandler(async (req, res) => {
      throw new ApiError(501, "Secure file storage is not configured. Document tracking is available now; uploads require private storage.")
    }),
  )

  router.get(
    "/calendar/events",
    asyncHandler(async (req, res) => {
      const events = await prisma.calendarEvent.findMany({
        where: { userId: req.user.id },
        include: { university: { select: { id: true, name: true, slug: true } } },
        orderBy: { startDate: "asc" },
      })

      res.json({ data: events.map(mapCalendarEvent) })
    }),
  )

  router.post(
    "/calendar/events",
    validateBody(calendarEventCreateSchema),
    asyncHandler(async (req, res) => {
      const event = await prisma.calendarEvent.create({
        data: { ...req.body, userId: req.user.id },
        include: { university: { select: { id: true, name: true, slug: true } } },
      })

      res.status(201).json({ data: mapCalendarEvent(event) })
    }),
  )

  router.patch(
    "/calendar/events/:id",
    validateBody(calendarEventUpdateSchema),
    asyncHandler(async (req, res) => {
      const id = parsePositiveId(req.params.id)
      const result = await prisma.calendarEvent.updateMany({ where: { id, userId: req.user.id }, data: req.body })
      if (result.count === 0) throw new ApiError(404, "Calendar event not found")
      const event = await prisma.calendarEvent.findFirst({
        where: { id, userId: req.user.id },
        include: { university: { select: { id: true, name: true, slug: true } } },
      })
      res.json({ data: mapCalendarEvent(event) })
    }),
  )

  router.delete(
    "/calendar/events/:id",
    asyncHandler(async (req, res) => {
      await prisma.calendarEvent.deleteMany({ where: { id: parsePositiveId(req.params.id), userId: req.user.id } })
      res.json({ data: { ok: true } })
    }),
  )

  router.get(
    "/calendar/export.ics",
    asyncHandler(async (req, res) => {
      const events = await prisma.calendarEvent.findMany({ where: { userId: req.user.id }, orderBy: { startDate: "asc" } })
      res.setHeader("Content-Type", "text/calendar; charset=utf-8")
      res.setHeader("Content-Disposition", "attachment; filename=unichase-calendar.ics")
      res.send(eventsToIcs(events))
    }),
  )

  router.get(
    "/calendar/events/:id/export.ics",
    asyncHandler(async (req, res) => {
      const event = await prisma.calendarEvent.findFirst({ where: { id: parsePositiveId(req.params.id), userId: req.user.id } })
      if (!event) throw new ApiError(404, "Calendar event not found")
      res.setHeader("Content-Type", "text/calendar; charset=utf-8")
      res.setHeader("Content-Disposition", `attachment; filename=unichase-event-${event.id}.ics`)
      res.send(eventsToIcs([event]))
    }),
  )

  return router
}
