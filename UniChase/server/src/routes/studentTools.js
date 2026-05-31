import { Router } from "express"
import { z } from "zod"
import { requireStudent } from "../auth.js"
import { ApiError, asyncHandler, isPrismaMissingRecord } from "../errors.js"
import { mapUniversityForClient } from "../mappers/universityMapper.js"

const cleanString = (maxLength) => z.string().trim().min(1).max(maxLength)
const optionalString = (maxLength) =>
  z
    .union([z.string().trim().max(maxLength), z.literal(""), z.null()])
    .optional()
    .transform((value) => (value ? value : null))

const optionalPositiveId = z
  .union([z.coerce.number().int().positive(), z.literal(""), z.null()])
  .optional()
  .transform((value) => (value ? Number(value) : null))

const optionalDate = z
  .union([z.coerce.date(), z.literal(""), z.null()])
  .optional()
  .transform((value) => (value ? value : null))

const rating = z.coerce.number().int().min(1).max(5)

const roadmapCreateSchema = z.object({
  universityId: optionalPositiveId,
  targetMajor: cleanString(140),
  degreeLevel: cleanString(80),
  intake: cleanString(80),
  preparationStatus: cleanString(120),
  deadlinePreference: optionalString(120),
})

const roadmapPatchSchema = roadmapCreateSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required")

const roadmapStepCreateSchema = z.object({
  title: cleanString(180),
  description: optionalString(500),
  dueDate: optionalDate,
  sortOrder: z.coerce.number().int().nonnegative().default(0),
})

const roadmapStepPatchSchema = roadmapStepCreateSchema
  .extend({
    completed: z.boolean().optional(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required")

const documentChecklistCreateSchema = z.object({
  universityId: optionalPositiveId,
  targetMajor: optionalString(140),
  degreeLevel: cleanString(80),
  nationality: optionalString(120),
  languageTrack: cleanString(80),
})

const documentItemCreateSchema = z.object({
  title: cleanString(180),
  description: optionalString(500),
  optional: z.boolean().default(false),
  sortOrder: z.coerce.number().int().nonnegative().default(0),
})

const documentItemPatchSchema = documentItemCreateSchema
  .extend({
    completed: z.boolean().optional(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required")

const essayCreateSchema = z.object({
  title: cleanString(160),
  targetUniversity: optionalString(160),
  targetMajor: optionalString(140),
  prompt: optionalString(800),
  content: z.string().max(12000).default(""),
})

const essayPatchSchema = essayCreateSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required")

const essayFeedbackSchema = z.object({
  title: optionalString(160),
  targetMajor: optionalString(140),
  content: cleanString(12000),
})

const visaChecklistPatchSchema = z.object({
  items: z
    .array(
      z.object({
        title: cleanString(180),
        description: optionalString(500),
        completed: z.boolean().default(false),
        dueDate: optionalDate,
        sortOrder: z.coerce.number().int().nonnegative().default(0),
      }),
    )
    .max(40),
})

const costEstimateSchema = z.object({
  universityId: optionalPositiveId,
  name: cleanString(160),
  tuitionPerSemester: z.coerce.number().int().nonnegative().default(0),
  semestersPerYear: z.coerce.number().int().positive().max(4).default(2),
  monthsPerSemester: z.coerce.number().positive().max(8).default(4.5),
  housingMonthly: z.coerce.number().int().nonnegative().default(0),
  foodMonthly: z.coerce.number().int().nonnegative().default(0),
  transportMonthly: z.coerce.number().int().nonnegative().default(0),
  personalMonthly: z.coerce.number().int().nonnegative().default(0),
  insuranceMonthly: z.coerce.number().int().nonnegative().default(0),
  applicationFees: z.coerce.number().int().nonnegative().default(0),
  flightCost: z.coerce.number().int().nonnegative().default(0),
  scholarshipAmount: z.coerce.number().int().nonnegative().default(0),
})

const eligibilitySchema = z.object({
  universityId: optionalPositiveId,
  targetProgram: cleanString(140),
  degreeLevel: cleanString(80),
  educationLevel: optionalString(120),
  gpa: z.coerce.number().min(0).max(4.5).optional().nullable(),
  englishScore: optionalString(80),
  koreanScore: optionalString(80),
  budget: z.coerce.number().int().nonnegative().optional().nullable(),
  nationality: optionalString(120),
  preferredLanguage: optionalString(80),
  hasTranscript: z.boolean().default(false),
  hasPassport: z.boolean().default(false),
  hasStudyPlan: z.boolean().default(false),
  hasRecommendation: z.boolean().default(false),
})

const reminderPreferenceSchema = z.object({
  emailEnabled: z.boolean().default(false),
  applicationDeadline: z.boolean().default(true),
  documentChecklist: z.boolean().default(true),
  roadmapStep: z.boolean().default(true),
  visaChecklist: z.boolean().default(true),
  savedUniversityDeadline: z.boolean().default(true),
  reminderDays: z.array(z.coerce.number().int().positive().max(365)).min(1).max(8).default([30, 14, 7, 1]),
  customEmail: optionalString(200),
})

function validate(schema, value, message = "Validation failed") {
  const parsed = schema.safeParse(value)

  if (!parsed.success) {
    throw new ApiError(
      400,
      message,
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

function countWords(value) {
  return value.trim().split(/\s+/).filter(Boolean).length
}

function dateAfter(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date
}

function mapStep(step) {
  return {
    ...step,
    dueDate: step.dueDate?.toISOString?.() ?? step.dueDate,
    createdAt: step.createdAt?.toISOString?.() ?? step.createdAt,
    updatedAt: step.updatedAt?.toISOString?.() ?? step.updatedAt,
  }
}

function mapRoadmap(roadmap) {
  return {
    id: roadmap.id,
    universityId: roadmap.universityId,
    targetMajor: roadmap.targetMajor,
    degreeLevel: roadmap.degreeLevel,
    intake: roadmap.intake,
    preparationStatus: roadmap.preparationStatus,
    deadlinePreference: roadmap.deadlinePreference,
    progress: roadmap.progress,
    university: roadmap.university ? mapUniversityForClient(roadmap.university) : null,
    steps: roadmap.steps?.map(mapStep) ?? [],
    createdAt: roadmap.createdAt?.toISOString?.() ?? roadmap.createdAt,
    updatedAt: roadmap.updatedAt?.toISOString?.() ?? roadmap.updatedAt,
  }
}

function mapDocumentChecklist(checklist) {
  return {
    id: checklist.id,
    universityId: checklist.universityId,
    targetMajor: checklist.targetMajor,
    degreeLevel: checklist.degreeLevel,
    nationality: checklist.nationality,
    languageTrack: checklist.languageTrack,
    progress: checklist.progress,
    university: checklist.university ? mapUniversityForClient(checklist.university) : null,
    items: checklist.items?.map(mapStep) ?? [],
    createdAt: checklist.createdAt?.toISOString?.() ?? checklist.createdAt,
    updatedAt: checklist.updatedAt?.toISOString?.() ?? checklist.updatedAt,
  }
}

function mapEssayDraft(draft) {
  return {
    id: draft.id,
    title: draft.title,
    targetUniversity: draft.targetUniversity,
    targetMajor: draft.targetMajor,
    prompt: draft.prompt,
    content: draft.content,
    feedback: draft.feedback,
    wordCount: draft.wordCount,
    characterCount: draft.characterCount,
    createdAt: draft.createdAt?.toISOString?.() ?? draft.createdAt,
    updatedAt: draft.updatedAt?.toISOString?.() ?? draft.updatedAt,
  }
}

function mapCostEstimate(estimate) {
  return {
    id: estimate.id,
    universityId: estimate.universityId,
    name: estimate.name,
    inputs: estimate.inputs,
    breakdown: estimate.breakdown,
    monthlyCost: estimate.monthlyCost,
    semesterCost: estimate.semesterCost,
    yearlyCost: estimate.yearlyCost,
    firstYearCost: estimate.firstYearCost,
    university: estimate.university ? mapUniversityForClient(estimate.university) : null,
    createdAt: estimate.createdAt?.toISOString?.() ?? estimate.createdAt,
    updatedAt: estimate.updatedAt?.toISOString?.() ?? estimate.updatedAt,
  }
}

function mapEligibility(result) {
  return {
    id: result.id,
    universityId: result.universityId,
    targetProgram: result.targetProgram,
    degreeLevel: result.degreeLevel,
    educationLevel: result.educationLevel,
    gpa: result.gpa,
    englishScore: result.englishScore,
    koreanScore: result.koreanScore,
    budget: result.budget,
    nationality: result.nationality,
    preferredLanguage: result.preferredLanguage,
    status: result.status,
    score: result.score,
    missingRequirements: result.missingRequirements,
    nextSteps: result.nextSteps,
    rawInput: result.rawInput,
    university: result.university ? mapUniversityForClient(result.university) : null,
    createdAt: result.createdAt?.toISOString?.() ?? result.createdAt,
    updatedAt: result.updatedAt?.toISOString?.() ?? result.updatedAt,
  }
}

function defaultRoadmapSteps(input) {
  return [
    {
      title: "Confirm eligibility and shortlist programs",
      description: `Review ${input.degreeLevel} requirements for ${input.targetMajor}.`,
      dueDate: dateAfter(7),
      sortOrder: 1,
    },
    {
      title: "Collect academic and identity documents",
      description: "Prepare transcript, graduation certificate, passport copy, and translations.",
      dueDate: dateAfter(21),
      sortOrder: 2,
    },
    {
      title: "Draft statement of purpose or study plan",
      description: "Write a clear essay with academic fit, motivation, and career goals.",
      dueDate: dateAfter(35),
      sortOrder: 3,
    },
    {
      title: "Submit application and confirm payment",
      description: `Submit before the ${input.intake} intake deadline and keep receipts.`,
      dueDate: dateAfter(60),
      sortOrder: 4,
    },
    {
      title: "Prepare visa and arrival plan",
      description: "After admission, move to visa documents, housing, insurance, and travel.",
      dueDate: dateAfter(90),
      sortOrder: 5,
    },
  ]
}

function defaultDocumentItems(input, university) {
  const items = [
    "Application form",
    "Passport copy",
    "Academic transcripts",
    "Graduation certificate or enrollment certificate",
    "Personal statement or study plan",
    "Financial proof",
  ]

  if (university?.requiredDocuments?.length) {
    university.requiredDocuments.forEach((item) => items.push(item))
  }

  if (/english/i.test(input.languageTrack)) {
    items.push("English proficiency proof")
  }

  if (/korean|topik/i.test(input.languageTrack)) {
    items.push("TOPIK or Korean language proof")
  }

  if (/graduate|master|phd|doctor/i.test(input.degreeLevel)) {
    items.push("Recommendation letters")
    items.push("Research plan or portfolio if required")
  }

  return [...new Set(items)].map((title, index) => ({
    title,
    description: index < 6 ? "Core document for most South Korean university applications." : null,
    optional: index >= 6,
    sortOrder: index + 1,
  }))
}

function defaultVisaItems() {
  return [
    "Certificate of admission",
    "Passport and passport photo",
    "Visa application form",
    "Financial proof",
    "Final transcript or graduation certificate",
    "Tuberculosis test if required by embassy",
    "Housing address in Korea",
    "Flight and arrival plan",
  ].map((title, index) => ({
    title,
    description: "Confirm this item with the Korean embassy or consulate for your country.",
    sortOrder: index + 1,
  }))
}

function buildEssayFeedback(input) {
  const words = countWords(input.content)
  const suggestions = []

  if (words < 250) {
    suggestions.push("Add more concrete academic examples, projects, or achievements.")
  }

  if (!/korea|korean|south korea/i.test(input.content)) {
    suggestions.push("Explain why South Korea is the right study environment for your goals.")
  }

  if (!/goal|career|future|plan/i.test(input.content)) {
    suggestions.push("Connect the essay to a clear career or study plan.")
  }

  if (input.targetMajor && !input.content.toLowerCase().includes(input.targetMajor.toLowerCase())) {
    suggestions.push(`Mention ${input.targetMajor} directly and explain your fit for the field.`)
  }

  if (suggestions.length === 0) {
    suggestions.push("The draft has a clear foundation. Polish transitions and verify program-specific details.")
  }

  return {
    wordCount: words,
    characterCount: input.content.length,
    tone: words > 700 ? "Detailed" : "Concise",
    suggestions,
    structure: [
      "Opening motivation",
      "Academic preparation",
      "University/program fit",
      "Career plan",
      "Closing commitment",
    ],
  }
}

function calculateCost(input) {
  const monthlyCost =
    input.housingMonthly +
    input.foodMonthly +
    input.transportMonthly +
    input.personalMonthly +
    input.insuranceMonthly
  const semesterCost = Math.round(input.tuitionPerSemester + monthlyCost * input.monthsPerSemester)
  const yearlyBeforeScholarship = input.tuitionPerSemester * input.semestersPerYear + monthlyCost * 12
  const yearlyCost = Math.max(0, yearlyBeforeScholarship - input.scholarshipAmount)
  const firstYearCost = yearlyCost + input.applicationFees + input.flightCost

  return {
    monthlyCost,
    semesterCost,
    yearlyCost,
    firstYearCost,
    breakdown: {
      tuition: input.tuitionPerSemester * input.semestersPerYear,
      housing: input.housingMonthly * 12,
      food: input.foodMonthly * 12,
      transport: input.transportMonthly * 12,
      personal: input.personalMonthly * 12,
      insurance: input.insuranceMonthly * 12,
      applicationFees: input.applicationFees,
      flightCost: input.flightCost,
      scholarshipAmount: input.scholarshipAmount,
    },
  }
}

function evaluateEligibility(input) {
  let score = 20
  const missingRequirements = []
  const nextSteps = []

  if (input.gpa && input.gpa >= 3.2) {
    score += 20
  } else {
    missingRequirements.push("Competitive GPA or stronger academic explanation")
  }

  if (input.englishScore || input.koreanScore) {
    score += 20
  } else {
    missingRequirements.push("Language proficiency score or language-track confirmation")
  }

  if (input.hasTranscript) {
    score += 10
  } else {
    missingRequirements.push("Academic transcript")
  }

  if (input.hasPassport) {
    score += 10
  } else {
    missingRequirements.push("Valid passport")
  }

  if (input.hasStudyPlan) {
    score += 10
  } else {
    missingRequirements.push("Personal statement or study plan")
  }

  if (!input.budget || input.budget >= 8000000) {
    score += 10
  } else {
    missingRequirements.push("Budget plan or scholarship strategy")
  }

  if (/graduate|master|phd|doctor/i.test(input.degreeLevel) && !input.hasRecommendation) {
    missingRequirements.push("Recommendation letters for graduate-level applications")
  }

  if (missingRequirements.length) {
    nextSteps.push("Create a document checklist and finish the missing items.")
    nextSteps.push("Check the official admission guide for exact score requirements.")
  } else {
    nextSteps.push("Shortlist programs and start the application roadmap.")
  }

  const status = score >= 80 ? "eligible" : score >= 55 ? "almost-ready" : "needs-preparation"

  return { score, status, missingRequirements, nextSteps }
}

async function refreshRoadmapProgress(prisma, roadmapId) {
  const steps = await prisma.roadmapStep.findMany({ where: { roadmapId } })
  const completed = steps.filter((step) => step.completed).length
  const progress = steps.length ? Math.round((completed / steps.length) * 100) : 0
  return prisma.applicationRoadmap.update({
    where: { id: roadmapId },
    data: { progress },
    include: { university: true, steps: { orderBy: { sortOrder: "asc" } } },
  })
}

async function refreshChecklistProgress(prisma, checklistId) {
  const items = await prisma.documentChecklistItem.findMany({ where: { checklistId } })
  const completed = items.filter((item) => item.completed).length
  const progress = items.length ? Math.round((completed / items.length) * 100) : 0
  return prisma.documentChecklist.update({
    where: { id: checklistId },
    data: { progress },
    include: { university: true, items: { orderBy: { sortOrder: "asc" } } },
  })
}

export function createStudentToolsRouter(prisma) {
  const router = Router()

  router.use(requireStudent(prisma))

  router.get(
    "/roadmaps",
    asyncHandler(async (req, res) => {
      const roadmaps = await prisma.applicationRoadmap.findMany({
        where: { userId: req.user.id },
        include: { university: true, steps: { orderBy: { sortOrder: "asc" } } },
        orderBy: { updatedAt: "desc" },
      })

      res.json({ data: roadmaps.map(mapRoadmap) })
    }),
  )

  router.post(
    "/roadmaps",
    asyncHandler(async (req, res) => {
      const data = validate(roadmapCreateSchema, req.body)
      const roadmap = await prisma.applicationRoadmap.create({
        data: {
          ...data,
          userId: req.user.id,
          steps: { create: defaultRoadmapSteps(data) },
        },
        include: { university: true, steps: { orderBy: { sortOrder: "asc" } } },
      })

      res.status(201).json({ data: mapRoadmap(roadmap) })
    }),
  )

  router.get(
    "/roadmaps/:id",
    asyncHandler(async (req, res) => {
      const roadmap = await prisma.applicationRoadmap.findFirst({
        where: { id: parsePositiveId(req.params.id), userId: req.user.id },
        include: { university: true, steps: { orderBy: { sortOrder: "asc" } } },
      })

      if (!roadmap) {
        throw new ApiError(404, "Roadmap not found")
      }

      res.json({ data: mapRoadmap(roadmap) })
    }),
  )

  router.patch(
    "/roadmaps/:id",
    asyncHandler(async (req, res) => {
      const id = parsePositiveId(req.params.id)
      const data = validate(roadmapPatchSchema, req.body)
      const existing = await prisma.applicationRoadmap.findFirst({ where: { id, userId: req.user.id } })

      if (!existing) {
        throw new ApiError(404, "Roadmap not found")
      }

      const roadmap = await prisma.applicationRoadmap.update({
        where: { id },
        data,
        include: { university: true, steps: { orderBy: { sortOrder: "asc" } } },
      })

      res.json({ data: mapRoadmap(roadmap) })
    }),
  )

  router.delete(
    "/roadmaps/:id",
    asyncHandler(async (req, res) => {
      const id = parsePositiveId(req.params.id)
      const existing = await prisma.applicationRoadmap.findFirst({ where: { id, userId: req.user.id } })

      if (!existing) {
        throw new ApiError(404, "Roadmap not found")
      }

      try {
        await prisma.applicationRoadmap.delete({ where: { id } })
      } catch (error) {
        if (!isPrismaMissingRecord(error)) {
          throw error
        }
      }

      res.json({ data: { ok: true } })
    }),
  )

  router.post(
    "/roadmaps/:id/steps",
    asyncHandler(async (req, res) => {
      const roadmapId = parsePositiveId(req.params.id)
      const roadmap = await prisma.applicationRoadmap.findFirst({ where: { id: roadmapId, userId: req.user.id } })

      if (!roadmap) {
        throw new ApiError(404, "Roadmap not found")
      }

      const data = validate(roadmapStepCreateSchema, req.body)
      await prisma.roadmapStep.create({ data: { ...data, roadmapId, custom: true } })
      const updated = await refreshRoadmapProgress(prisma, roadmapId)
      res.status(201).json({ data: mapRoadmap(updated) })
    }),
  )

  router.patch(
    "/roadmap-steps/:stepId",
    asyncHandler(async (req, res) => {
      const id = parsePositiveId(req.params.stepId, "step id")
      const data = validate(roadmapStepPatchSchema, req.body)
      const step = await prisma.roadmapStep.findFirst({
        where: { id, roadmap: { userId: req.user.id } },
      })

      if (!step) {
        throw new ApiError(404, "Roadmap step not found")
      }

      await prisma.roadmapStep.update({ where: { id }, data })
      const roadmap = await refreshRoadmapProgress(prisma, step.roadmapId)
      res.json({ data: mapRoadmap(roadmap) })
    }),
  )

  router.delete(
    "/roadmap-steps/:stepId",
    asyncHandler(async (req, res) => {
      const id = parsePositiveId(req.params.stepId, "step id")
      const step = await prisma.roadmapStep.findFirst({
        where: { id, roadmap: { userId: req.user.id } },
      })

      if (!step) {
        throw new ApiError(404, "Roadmap step not found")
      }

      await prisma.roadmapStep.delete({ where: { id } })
      const roadmap = await refreshRoadmapProgress(prisma, step.roadmapId)
      res.json({ data: mapRoadmap(roadmap) })
    }),
  )

  router.get(
    "/document-checklists",
    asyncHandler(async (req, res) => {
      const checklists = await prisma.documentChecklist.findMany({
        where: { userId: req.user.id },
        include: { university: true, items: { orderBy: { sortOrder: "asc" } } },
        orderBy: { updatedAt: "desc" },
      })

      res.json({ data: checklists.map(mapDocumentChecklist) })
    }),
  )

  router.post(
    "/document-checklists",
    asyncHandler(async (req, res) => {
      const data = validate(documentChecklistCreateSchema, req.body)
      const university = data.universityId
        ? await prisma.university.findUnique({ where: { id: data.universityId } })
        : null
      const checklist = await prisma.documentChecklist.create({
        data: {
          ...data,
          userId: req.user.id,
          items: { create: defaultDocumentItems(data, university) },
        },
        include: { university: true, items: { orderBy: { sortOrder: "asc" } } },
      })

      res.status(201).json({ data: mapDocumentChecklist(checklist) })
    }),
  )

  router.post(
    "/document-checklists/:id/items",
    asyncHandler(async (req, res) => {
      const checklistId = parsePositiveId(req.params.id)
      const checklist = await prisma.documentChecklist.findFirst({
        where: { id: checklistId, userId: req.user.id },
      })

      if (!checklist) {
        throw new ApiError(404, "Document checklist not found")
      }

      const data = validate(documentItemCreateSchema, req.body)
      await prisma.documentChecklistItem.create({ data: { ...data, checklistId, custom: true } })
      const updated = await refreshChecklistProgress(prisma, checklistId)
      res.status(201).json({ data: mapDocumentChecklist(updated) })
    }),
  )

  router.patch(
    "/document-checklist-items/:itemId",
    asyncHandler(async (req, res) => {
      const id = parsePositiveId(req.params.itemId, "item id")
      const data = validate(documentItemPatchSchema, req.body)
      const item = await prisma.documentChecklistItem.findFirst({
        where: { id, checklist: { userId: req.user.id } },
      })

      if (!item) {
        throw new ApiError(404, "Document checklist item not found")
      }

      await prisma.documentChecklistItem.update({ where: { id }, data })
      const checklist = await refreshChecklistProgress(prisma, item.checklistId)
      res.json({ data: mapDocumentChecklist(checklist) })
    }),
  )

  router.delete(
    "/document-checklist-items/:itemId",
    asyncHandler(async (req, res) => {
      const id = parsePositiveId(req.params.itemId, "item id")
      const item = await prisma.documentChecklistItem.findFirst({
        where: { id, checklist: { userId: req.user.id } },
      })

      if (!item) {
        throw new ApiError(404, "Document checklist item not found")
      }

      await prisma.documentChecklistItem.delete({ where: { id } })
      const checklist = await refreshChecklistProgress(prisma, item.checklistId)
      res.json({ data: mapDocumentChecklist(checklist) })
    }),
  )

  router.get(
    "/essay-drafts",
    asyncHandler(async (req, res) => {
      const drafts = await prisma.essayDraft.findMany({
        where: { userId: req.user.id },
        orderBy: { updatedAt: "desc" },
      })

      res.json({ data: drafts.map(mapEssayDraft) })
    }),
  )

  router.post(
    "/essay-drafts",
    asyncHandler(async (req, res) => {
      const data = validate(essayCreateSchema, req.body)
      const feedback = data.content ? buildEssayFeedback(data) : null
      const draft = await prisma.essayDraft.create({
        data: {
          ...data,
          feedback,
          wordCount: countWords(data.content),
          characterCount: data.content.length,
          userId: req.user.id,
        },
      })

      res.status(201).json({ data: mapEssayDraft(draft) })
    }),
  )

  router.patch(
    "/essay-drafts/:id",
    asyncHandler(async (req, res) => {
      const id = parsePositiveId(req.params.id)
      const data = validate(essayPatchSchema, req.body)
      const existing = await prisma.essayDraft.findFirst({ where: { id, userId: req.user.id } })

      if (!existing) {
        throw new ApiError(404, "Essay draft not found")
      }

      const nextContent = data.content ?? existing.content
      const draft = await prisma.essayDraft.update({
        where: { id },
        data: {
          ...data,
          feedback: buildEssayFeedback({
            title: data.title ?? existing.title,
            targetMajor: data.targetMajor ?? existing.targetMajor,
            content: nextContent,
          }),
          wordCount: countWords(nextContent),
          characterCount: nextContent.length,
        },
      })

      res.json({ data: mapEssayDraft(draft) })
    }),
  )

  router.delete(
    "/essay-drafts/:id",
    asyncHandler(async (req, res) => {
      const id = parsePositiveId(req.params.id)
      const existing = await prisma.essayDraft.findFirst({ where: { id, userId: req.user.id } })

      if (!existing) {
        throw new ApiError(404, "Essay draft not found")
      }

      try {
        await prisma.essayDraft.delete({ where: { id } })
      } catch (error) {
        if (!isPrismaMissingRecord(error)) {
          throw error
        }
      }

      res.json({ data: { ok: true } })
    }),
  )

  router.post(
    "/essay-feedback",
    asyncHandler(async (req, res) => {
      const data = validate(essayFeedbackSchema, req.body)
      res.json({ data: buildEssayFeedback(data) })
    }),
  )

  router.get(
    "/visa-checklist",
    asyncHandler(async (req, res) => {
      let items = await prisma.visaChecklistItem.findMany({
        where: { userId: req.user.id },
        orderBy: { sortOrder: "asc" },
      })

      if (items.length === 0) {
        items = await prisma.visaChecklistItem.createManyAndReturn({
          data: defaultVisaItems().map((item) => ({ ...item, userId: req.user.id })),
        })
      }

      res.json({ data: items.map(mapStep) })
    }),
  )

  router.patch(
    "/visa-checklist",
    asyncHandler(async (req, res) => {
      const data = validate(visaChecklistPatchSchema, req.body)
      await prisma.visaChecklistItem.deleteMany({ where: { userId: req.user.id } })
      const items = await prisma.visaChecklistItem.createManyAndReturn({
        data: data.items.map((item) => ({ ...item, userId: req.user.id })),
      })

      res.json({ data: items.map(mapStep) })
    }),
  )

  router.patch(
    "/visa-checklist/:id",
    asyncHandler(async (req, res) => {
      const id = parsePositiveId(req.params.id)
      const data = validate(roadmapStepPatchSchema, req.body)
      const item = await prisma.visaChecklistItem.findFirst({ where: { id, userId: req.user.id } })

      if (!item) {
        throw new ApiError(404, "Visa checklist item not found")
      }

      const updated = await prisma.visaChecklistItem.update({ where: { id }, data })
      res.json({ data: mapStep(updated) })
    }),
  )

  router.get(
    "/cost-estimates",
    asyncHandler(async (req, res) => {
      const estimates = await prisma.costEstimate.findMany({
        where: { userId: req.user.id },
        include: { university: true },
        orderBy: { updatedAt: "desc" },
      })

      res.json({ data: estimates.map(mapCostEstimate) })
    }),
  )

  router.post(
    "/cost-estimates",
    asyncHandler(async (req, res) => {
      const data = validate(costEstimateSchema, req.body)
      const calculated = calculateCost(data)
      const estimate = await prisma.costEstimate.create({
        data: {
          userId: req.user.id,
          universityId: data.universityId,
          name: data.name,
          inputs: data,
          breakdown: calculated.breakdown,
          monthlyCost: calculated.monthlyCost,
          semesterCost: calculated.semesterCost,
          yearlyCost: calculated.yearlyCost,
          firstYearCost: calculated.firstYearCost,
        },
        include: { university: true },
      })

      res.status(201).json({ data: mapCostEstimate(estimate) })
    }),
  )

  router.delete(
    "/cost-estimates/:id",
    asyncHandler(async (req, res) => {
      const id = parsePositiveId(req.params.id)
      const existing = await prisma.costEstimate.findFirst({ where: { id, userId: req.user.id } })

      if (!existing) {
        throw new ApiError(404, "Cost estimate not found")
      }

      try {
        await prisma.costEstimate.delete({ where: { id } })
      } catch (error) {
        if (!isPrismaMissingRecord(error)) {
          throw error
        }
      }

      res.json({ data: { ok: true } })
    }),
  )

  router.get(
    "/eligibility-results",
    asyncHandler(async (req, res) => {
      const results = await prisma.eligibilityResult.findMany({
        where: { userId: req.user.id },
        include: { university: true },
        orderBy: { updatedAt: "desc" },
      })

      res.json({ data: results.map(mapEligibility) })
    }),
  )

  router.post(
    "/eligibility-checks",
    asyncHandler(async (req, res) => {
      const data = validate(eligibilitySchema, req.body)
      const result = evaluateEligibility(data)
      const created = await prisma.eligibilityResult.create({
        data: {
          userId: req.user.id,
          universityId: data.universityId,
          targetProgram: data.targetProgram,
          degreeLevel: data.degreeLevel,
          educationLevel: data.educationLevel,
          gpa: data.gpa,
          englishScore: data.englishScore,
          koreanScore: data.koreanScore,
          budget: data.budget,
          nationality: data.nationality,
          preferredLanguage: data.preferredLanguage,
          status: result.status,
          score: result.score,
          missingRequirements: result.missingRequirements,
          nextSteps: result.nextSteps,
          rawInput: data,
        },
        include: { university: true },
      })

      res.status(201).json({ data: mapEligibility(created) })
    }),
  )

  router.get(
    "/reminder-preferences",
    asyncHandler(async (req, res) => {
      const preferences = await prisma.reminderPreference.upsert({
        where: { userId: req.user.id },
        update: {},
        create: { userId: req.user.id },
      })

      res.json({ data: preferences })
    }),
  )

  router.put(
    "/reminder-preferences",
    asyncHandler(async (req, res) => {
      const data = validate(reminderPreferenceSchema, req.body)
      const preferences = await prisma.reminderPreference.upsert({
        where: { userId: req.user.id },
        update: data,
        create: { ...data, userId: req.user.id },
      })

      res.json({ data: preferences })
    }),
  )

  router.get(
    "/scheduled-reminders",
    asyncHandler(async (req, res) => {
      const reminders = await prisma.scheduledReminder.findMany({
        where: { userId: req.user.id },
        orderBy: { sendAt: "asc" },
      })

      res.json({ data: reminders })
    }),
  )

  return router
}
