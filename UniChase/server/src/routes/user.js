import { syncCalendarSources } from "../services/calendarSources.js"
import { eventsToIcs } from "../calendar.js"
import { assertOwnedLinks, assertDateRange, mapPrivateDocument } from "../ownership.js"
import { parsePagination } from "../pagination.js"
import { scoreUniversities } from "../recommendations.js"
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
    sourceKey: event.sourceKey,
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

async function createNotification(prisma, data) {
  return prisma.notification.create({ data }).catch(() => null)
}

async function upsertApplicationDeadlineEvent(prisma, application) {
  if (!application.applicationDeadline) {
    await prisma.calendarEvent.deleteMany({ where: { userId: application.userId, applicationId: application.id, eventType: "application_deadline" } })
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
      if (Object.hasOwn(req.body, "budgetMin") || Object.hasOwn(req.body, "budgetMax")) {
        const current = await prisma.studentUser.findUnique({ where: { id: req.user.id }, select: { budgetMin: true, budgetMax: true } })
        const min = Object.hasOwn(req.body, "budgetMin") ? req.body.budgetMin : current.budgetMin
        const max = Object.hasOwn(req.body, "budgetMax") ? req.body.budgetMax : current.budgetMax
        if (min != null && max != null && min > max) throw new ApiError(400, "Minimum budget cannot exceed maximum budget")
      }
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
        ...(() => { const { take, skip } = parsePagination(req.query, 100); return { take, skip } })(),
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

  router.get("/followed-universities", asyncHandler(async (req, res) => {
    const { take, skip } = parsePagination(req.query, 100)
    const items = await prisma.followedUniversity.findMany({ where: { userId: req.user.id }, include: { university: true }, orderBy: { createdAt: "desc" }, take, skip })
    res.json({ data: items.map((item) => ({ createdAt: item.createdAt, university: mapUniversityForClient(item.university) })) })
  }))
  router.post("/followed-universities", validateBody(savedUniversitySchema), asyncHandler(async (req, res) => {
    await assertOwnedLinks(prisma, req.user.id, req.body)
    const item = await prisma.followedUniversity.upsert({ where: { userId_universityId: { userId: req.user.id, universityId: req.body.universityId } }, update: {}, create: { userId: req.user.id, universityId: req.body.universityId }, include: { university: true } })
    res.status(201).json({ data: { createdAt: item.createdAt, university: mapUniversityForClient(item.university) } })
  }))
  router.delete("/followed-universities/:id", asyncHandler(async (req, res) => {
    await prisma.followedUniversity.deleteMany({ where: { userId: req.user.id, universityId: parsePositiveId(req.params.id) } })
    res.json({ data: { ok: true } })
  }))
  router.delete("/deadlines/:id", asyncHandler(async (req, res) => {
    await prisma.userDeadline.deleteMany({ where: { userId: req.user.id, id: parsePositiveId(req.params.id) } })
    res.json({ data: { ok: true } })
  }))

  router.get(
    "/deadlines",
    asyncHandler(async (req, res) => {
      const reminders = await prisma.userDeadline.findMany({
        ...(() => { const { take, skip } = parsePagination(req.query, 100); return { take, skip } })(),
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
      await assertOwnedLinks(prisma, req.user.id, req.body)
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
        ...(() => { const { take, skip } = parsePagination(req.query, 100); return { take, skip } })(),
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
      const items = await prisma.$transaction(async (tx) => {
        const ids = req.body.items.filter((item) => item.id).map((item) => item.id)
        if (new Set(ids).size !== ids.length) throw new ApiError(400, "Checklist item ids must be unique")
        const owned = await tx.checklistItem.count({ where: { userId: req.user.id, id: { in: ids } } })
        if (owned !== ids.length) throw new ApiError(404, "Checklist item not found")
        await tx.checklistItem.deleteMany({ where: { userId: req.user.id, id: { notIn: ids } } })
        return Promise.all(req.body.items.map(({ id, ...data }) => id
          ? tx.checklistItem.update({ where: { id, userId: req.user.id }, data })
          : tx.checklistItem.create({ data: { ...data, userId: req.user.id } })))
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
      const current = await prisma.userOnboardingPreference.findUnique({ where: { userId: req.user.id } })
      const merged = { ...current, ...req.body }
      if ((merged.budgetMin != null && merged.budgetMax != null && merged.budgetMin > merged.budgetMax) ||
          (merged.qsRankMin != null && merged.qsRankMax != null && merged.qsRankMin > merged.qsRankMax)) {
        throw new ApiError(400, "Minimum onboarding values cannot exceed maximum values")
      }
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
      if (!preference) throw new ApiError(409, "Complete or skip onboarding before generating the dashboard")

      const universities = await prisma.university.findMany({
        orderBy: [{ qsRanking: { sort: "asc", nulls: "last" } }, { name: "asc" }],
        take: 1000,
      })
      const recommendations = scoreUniversities(universities, {
        preferredMajor: preference.desiredMajor,
        preferredCity: preference.preferredCity,
        level: preference.degreeLevel,
        language: preference.languagePreference,
        dormitoryRequired: preference.dormitoryRequired,
        scholarshipPreferred: /yes|prefer|required|important/i.test(preference.scholarshipPreference || ""),
        tuitionMin: preference.budgetMin,
        tuitionMax: preference.budgetMax,
        rankingMin: preference.qsRankMin,
        rankingMax: preference.qsRankMax,
      })
      const suggested = recommendations.slice(0, 4)
      const primary = suggested[0]?.university

      const created = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "StudentUser" WHERE "id" = ${req.user.id} FOR UPDATE`
        for (const item of suggested.slice(0, 3)) {
          await tx.savedUniversity.upsert({
            where: { userId_universityId: { userId: req.user.id, universityId: item.university.id } },
            update: {},
            create: { userId: req.user.id, universityId: item.university.id, notes: "Suggested from onboarding" },
          })
        }

        let roadmapCreated = false
        if (await tx.applicationRoadmap.count({ where: { userId: req.user.id } }) === 0) {
          await tx.applicationRoadmap.create({
            data: {
              userId: req.user.id,
              universityId: primary?.id ?? null,
              targetMajor: preference.desiredMajor || "Undecided program",
              degreeLevel: preference.degreeLevel || "Undecided degree level",
              intake: preference.targetIntake || "Next available intake",
              preparationStatus: preference.preparationStage || "Planning",
              steps: { create: [
                { title: "Confirm program and official requirements", description: "Use the official university admissions page.", sortOrder: 1 },
                { title: "Prepare passport and academic records", sortOrder: 2 },
                { title: "Confirm language test requirements", sortOrder: 3 },
                { title: "Review tuition, scholarships, and housing", sortOrder: 4 },
                { title: "Submit the application before the official deadline", sortOrder: 5 },
                { title: "Prepare the student visa application", sortOrder: 6 },
              ] },
            },
          })
          roadmapCreated = true
        }

        let documentChecklistCreated = false
        if (await tx.documentChecklist.count({ where: { userId: req.user.id } }) === 0) {
          await tx.documentChecklist.create({
            data: {
              userId: req.user.id,
              universityId: primary?.id ?? null,
              targetMajor: preference.desiredMajor,
              degreeLevel: preference.degreeLevel || "Undecided degree level",
              nationality: preference.nationality,
              languageTrack: preference.languagePreference || "Undecided",
              items: { create: ["Application form", "Passport copy", "Academic transcript", "Graduation certificate", "Personal statement", "Financial proof"].map((title, index) => ({ title, sortOrder: index + 1 })) },
            },
          })
          documentChecklistCreated = true
        }

        let visaChecklistCreated = false
        if (await tx.visaChecklistItem.count({ where: { userId: req.user.id } }) === 0) {
          await tx.visaChecklistItem.createMany({ data: ["Certificate of admission", "Passport and photo", "Visa application form", "Financial proof", "Academic records", "Housing address"].map((title, index) => ({ userId: req.user.id, title, description: "Confirm current requirements with the Korean embassy or consulate serving your country.", sortOrder: index + 1 })) })
          visaChecklistCreated = true
        }

        const checklistCreated = await tx.checklistItem.count({ where: { userId: req.user.id } }) === 0
        if (checklistCreated) await tx.checklistItem.createMany({ data: ["Confirm target intake", "Prepare passport and transcripts", "Shortlist 3 universities", "Check visa document requirements"].map((title) => ({ userId: req.user.id, title })) })

        const resultSnapshot = suggested.map((item) => ({ universityId: item.university.id, score: item.score, reasons: item.reasons, disadvantages: item.disadvantages }))
        const previousRecommendation = await tx.recommendationPreference.findFirst({ where: { userId: req.user.id }, orderBy: { createdAt: "desc" } })
        const recommendationData = { userId: req.user.id, preferredMajor: preference.desiredMajor, preferredCity: preference.preferredCity, language: preference.languagePreference, dormitoryRequired: preference.dormitoryRequired, scholarshipPreferred: /yes|prefer|required|important/i.test(preference.scholarshipPreference || ""), level: preference.degreeLevel, rankingMin: preference.qsRankMin, rankingMax: preference.qsRankMax, tuitionMin: preference.budgetMin, tuitionMax: preference.budgetMax, results: resultSnapshot }
        if (previousRecommendation) await tx.recommendationPreference.update({ where: { id: previousRecommendation.id }, data: recommendationData })
        else await tx.recommendationPreference.create({ data: recommendationData })

        await tx.userOnboardingPreference.update({ where: { userId: req.user.id }, data: { onboardingCompleted: true } })
        if (roadmapCreated || documentChecklistCreated || visaChecklistCreated || checklistCreated) {
          await tx.notification.create({ data: { userId: req.user.id, type: "dashboard_setup", title: "Dashboard setup is ready", message: "UniChase created starter planning tools from your onboarding answers.", linkUrl: "/dashboard" } })
        }
        return { roadmapCreated, documentChecklistCreated, visaChecklistCreated, checklistCreated }
      }, { isolationLevel: "Serializable" })

      res.json({ data: {
        recommendedUniversities: suggested.map((item) => ({ university: mapUniversityForClient(item.university), score: item.score, reasons: item.reasons, disadvantages: item.disadvantages })),
        ...created,
      } })
    }),
  )

  router.get(
    "/applications",
    asyncHandler(async (req, res) => {
      const applications = await prisma.userApplication.findMany({
        ...(() => { const { take, skip } = parsePagination(req.query, 100); return { take, skip } })(),
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
      await assertOwnedLinks(prisma, req.user.id, req.body)
      const application = await prisma.$transaction(async (tx) => {
        const created = await tx.userApplication.create({ data: { ...req.body, userId: req.user.id }, include: { university: true } })
        await upsertApplicationDeadlineEvent(tx, created)
        return created
      })
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

      const application = await prisma.$transaction(async (tx) => {
        const updated = await tx.userApplication.update({ where: { id, userId: req.user.id }, data: req.body, include: { university: true } })
        await upsertApplicationDeadlineEvent(tx, updated)
        return updated
      })
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
        ...(() => { const { take, skip } = parsePagination(req.query, 100); return { take, skip } })(),
        where: { userId: req.user.id },
        orderBy: [{ updatedAt: "desc" }],
      })

      res.json({ data: documents.map(mapPrivateDocument) })
    }),
  )

  router.post(
    "/documents",
    validateBody(userDocumentCreateSchema),
    asyncHandler(async (req, res) => {
      await assertOwnedLinks(prisma, req.user.id, req.body)
      const document = await prisma.userDocument.create({ data: { ...req.body, userId: req.user.id } })
      res.status(201).json({ data: mapPrivateDocument(document) })
    }),
  )

  router.get(
    "/documents/:id",
    asyncHandler(async (req, res) => {
      const document = await prisma.userDocument.findFirst({ where: { id: parsePositiveId(req.params.id), userId: req.user.id } })
      if (!document) throw new ApiError(404, "Document not found")
      res.json({ data: mapPrivateDocument(document) })
    }),
  )

  router.patch(
    "/documents/:id",
    validateBody(userDocumentUpdateSchema),
    asyncHandler(async (req, res) => {
      const id = parsePositiveId(req.params.id)
      await assertOwnedLinks(prisma, req.user.id, req.body)
      const result = await prisma.userDocument.updateMany({ where: { id, userId: req.user.id }, data: req.body })
      if (result.count === 0) throw new ApiError(404, "Document not found")
      const document = await prisma.userDocument.findFirst({ where: { id, userId: req.user.id } })
      res.json({ data: mapPrivateDocument(document) })
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
      await syncCalendarSources(prisma, req.user.id)
      const events = await prisma.calendarEvent.findMany({
        ...(() => { const { take, skip } = parsePagination(req.query, 100); return { take, skip } })(),
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
      await assertOwnedLinks(prisma, req.user.id, req.body)
      assertDateRange(req.body)
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
      const existing = await prisma.calendarEvent.findFirst({ where: { id, userId: req.user.id } })
      if (!existing) throw new ApiError(404, "Calendar event not found")
      await assertOwnedLinks(prisma, req.user.id, req.body)
      assertDateRange({ ...existing, ...req.body })
      if (existing.sourceKey?.startsWith('auto:') && req.body.status && req.body.status !== 'cancelled') {
        const [, kind, sourceId] = existing.sourceKey.split(':')
        const completed = req.body.status === 'completed'
        if (kind === 'roadmap') await prisma.roadmapStep.updateMany({ where: { id: Number(sourceId), roadmap: { userId: req.user.id } }, data: { completed } })
        if (kind === 'visa') await prisma.visaChecklistItem.updateMany({ where: { id: Number(sourceId), userId: req.user.id }, data: { completed } })
        if (kind === 'checklist') await prisma.checklistItem.updateMany({ where: { id: Number(sourceId), userId: req.user.id }, data: { completed } })
      }
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
      await syncCalendarSources(prisma, req.user.id)
      const events = await prisma.calendarEvent.findMany({ where: { userId: req.user.id }, orderBy: { startDate: "asc" }, take: 5000 })
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
