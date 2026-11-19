import { z } from "zod"
import { ApiError } from "./errors.js"

const cleanString = (maxLength) => z.string().trim().min(1).max(maxLength)
const stringArray = z.array(cleanString(140)).max(80)
const nullableString = (maxLength) => z.union([cleanString(maxLength), z.literal("").transform(() => null)]).nullable().optional()
const nullableInt = z.preprocess((value) => value === "" ? null : value, z.coerce.number().int().min(0).max(2147483647).nullable().optional())
const nullableBoolean = z.union([z.boolean(), z.enum(["true", "false", "1", "0"]).transform((value) => ["true", "1"].includes(value))]).nullable().optional()
const nullableDate = z.preprocess((value) => value === "" ? null : value, z.coerce.date().nullable().optional())
const optionalPositiveInt = z.coerce.number().int().positive().max(2147483647).optional()
const webUrl = (maxLength) => z.string().trim().url().max(maxLength).refine((value) => /^https?:\/\//i.test(value), "Use an http or https URL")
const nullableUrl = (maxLength) => z.union([webUrl(maxLength), z.literal("").transform(() => null)]).nullable().optional()
const verificationStatus = z.enum(["verified", "manually added", "needs verification", "outdated"])
const roleStatus = z.enum(["active", "inactive", "pending"])

const universityBaseShape = {
  name: cleanString(180),
  slug: nullableString(220),
  koreanName: nullableString(180),
  city: cleanString(120),
  province: nullableString(120),
  verificationStatus: z.enum(["verified", "manually added", "needs verification", "outdated"]),
  country: cleanString(120),
  universityType: z.enum(["public", "private"]),
  qsRanking: nullableInt,
  qsRankingLabel: nullableString(40),
  qsRankingYear: nullableInt,
  rankingSourceNote: nullableString(800),
  qsSourceUrl: nullableUrl(800),
  sourceUrls: z.array(webUrl(800)).max(20),
  lastVerifiedAt: nullableDate,
  officialWebsite: webUrl(500),
  imageUrl: nullableUrl(800),
  logoUrl: nullableUrl(800),
  campusImageUrl: nullableUrl(800),
  imageAlt: nullableString(240),
  imageSourceUrl: nullableUrl(800),
  imageLastVerifiedAt: nullableDate,
  description: cleanString(4000),
  fullDescription: nullableString(8000),
  programs: stringArray,
  tuitionMin: nullableInt,
  tuitionMax: nullableInt,
  tuitionCurrency: cleanString(12),
  admissionRequirements: stringArray,
  languagesOfInstruction: stringArray,
  scholarshipInfo: nullableString(2000),
  hasScholarships: nullableBoolean,
  hasDormitory: nullableBoolean,
  housingInfo: nullableString(2000),
  internationalStudentInfo: nullableString(2000),
  studentLife: nullableString(2000),
  requiredDocuments: stringArray,
  applicationSteps: stringArray,
  studyLevels: stringArray,
  applicationDeadlines: z.record(z.string(), z.unknown()).nullable().optional(),
  applicationOpenDate: nullableDate,
  applicationDeadline: nullableDate,
  scholarshipDeadline: nullableDate,
  documentDeadline: nullableDate,
  tags: stringArray,
  contactEmail: z
    .union([z.string().trim().email().max(200), z.literal(""), z.null()])
    .optional()
    .transform((value) => {
      if (value === "") {
        return null
      }

      return value
    }),
  contactPhone: nullableString(80),
  contactAddress: nullableString(300),
  mainColor: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/),
  acceptanceRate: nullableString(40),
}

function hasValidTuitionRange(data) {
  if (data.tuitionMin === null || data.tuitionMin === undefined) {
    return true
  }

  if (data.tuitionMax === null || data.tuitionMax === undefined) {
    return true
  }

  return data.tuitionMin <= data.tuitionMax
}

export const universityCreateSchema = z
  .object({
    ...universityBaseShape,
    verificationStatus: universityBaseShape.verificationStatus.default("needs verification"),
    universityType: universityBaseShape.universityType.default("private"),
    sourceUrls: universityBaseShape.sourceUrls.default([]),
    country: universityBaseShape.country.default("South Korea"),
    tuitionCurrency: universityBaseShape.tuitionCurrency.default("KRW"),
    admissionRequirements: universityBaseShape.admissionRequirements.default([]),
    hasScholarships: universityBaseShape.hasScholarships.default(null),
    hasDormitory: universityBaseShape.hasDormitory.default(null),
    requiredDocuments: universityBaseShape.requiredDocuments.default([]),
    applicationSteps: universityBaseShape.applicationSteps.default([]),
    studyLevels: universityBaseShape.studyLevels.default([]),
    tags: universityBaseShape.tags.default([]),
    mainColor: universityBaseShape.mainColor.default("#15397F"),
  })
  .refine(hasValidTuitionRange, {
    message: "tuitionMin must be less than or equal to tuitionMax",
    path: ["tuitionMax"],
  })

export const universityUpdateSchema = z
  .object(universityBaseShape)
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update",
  })
  .refine(hasValidTuitionRange, {
    message: "tuitionMin must be less than or equal to tuitionMax",
    path: ["tuitionMax"],
  })

export const universityImageUpdateSchema = z
  .object({
    imageUrl: nullableUrl(800),
    logoUrl: nullableUrl(800),
    campusImageUrl: nullableUrl(800),
    imageAlt: nullableString(240),
    imageSourceUrl: nullableUrl(800),
    imageLastVerifiedAt: nullableDate,
    lastVerifiedAt: nullableDate,
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one image field is required",
  })

export const adminLoginSchema = z.object({
  email: z.string().trim().email().max(200).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(200).refine((value) => Buffer.byteLength(value, "utf8") <= 72, "Password must be at most 72 UTF-8 bytes"),
})

const booleanQuery = z
  .enum(["true", "false", "1", "0", "yes", "no"])
  .optional()
  .transform((value) => {
    if (!value) {
      return undefined
    }

    return ["true", "1", "yes"].includes(value)
  })

export const universityQuerySchema = z
  .object({
    q: z.string().trim().max(120).optional(),
    search: z.string().trim().max(120).optional(),
    name: z.string().trim().max(120).optional(),
    city: z.string().trim().max(120).optional(),
    ranking: optionalPositiveInt,
    rankingMin: optionalPositiveInt,
    rankingMax: optionalPositiveInt,
    maxRanking: optionalPositiveInt,
    tuition: optionalPositiveInt,
    tuitionMin: optionalPositiveInt,
    tuitionMax: optionalPositiveInt,
    maxTuition: optionalPositiveInt,
    major: z.string().trim().max(140).optional(),
    language: z.string().trim().max(80).optional(),
    english: booleanQuery,
    dormitory: booleanQuery,
    type: z.enum(["public", "private"]).optional(),
    deadline: z.enum(["open", "soon", "closed", "upcoming"]).optional(),
    level: z.string().trim().max(80).optional(),
    scholarship: booleanQuery,
    hasScholarships: booleanQuery,
    sort: z.enum(["qsRank", "name", "city", "tuition", "recent"]).optional(),
  })
  .strip()

export const userRegisterSchema = z.object({
  name: cleanString(120),
  email: z.string().trim().email().max(200).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(200).refine((value) => Buffer.byteLength(value, "utf8") <= 72, "Password must be at most 72 UTF-8 bytes"),
})

export const userLoginSchema = z.object({
  email: z.string().trim().email().max(200).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(200).refine((value) => Buffer.byteLength(value, "utf8") <= 72, "Password must be at most 72 UTF-8 bytes"),
})

export const userProfileSchema = z
  .object({
    name: cleanString(120).optional(),
    preferredMajor: nullableString(140),
    preferredCity: nullableString(120),
    preferredLevel: nullableString(80),
    budgetMin: nullableInt,
    budgetMax: nullableInt,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one profile field is required",
  }).refine((data) => data.budgetMin == null || data.budgetMax == null || data.budgetMin <= data.budgetMax, { message: "Minimum budget cannot exceed maximum budget" })

export const savedUniversitySchema = z.object({
  universityId: z.coerce.number().int().positive(),
  notes: nullableString(1000),
})

export const compareQuerySchema = z.object({
  ids: z.string().trim().regex(/^\d+(,\d+){1,3}$/, "Compare requires 2 to 4 university ids")
    .transform((value) => value.split(",").map(Number))
    .refine((ids) => ids.every((id) => Number.isSafeInteger(id) && id > 0 && id <= 2147483647) && new Set(ids).size === ids.length, "Use 2 to 4 distinct positive university ids"),
})

export const recommendationSchema = z.object({
  preferredMajor: nullableString(140),
  tuitionMin: nullableInt,
  tuitionMax: nullableInt,
  preferredCity: nullableString(120),
  language: nullableString(80),
  englishRequired: nullableBoolean,
  dormitoryRequired: nullableBoolean,
  rankingMin: nullableInt,
  rankingMax: nullableInt,
  level: nullableString(80),
  scholarshipPreferred: nullableBoolean,
}).refine((data) => (data.tuitionMin == null || data.tuitionMax == null || data.tuitionMin <= data.tuitionMax) && (data.rankingMin == null || data.rankingMax == null || data.rankingMin <= data.rankingMax), { message: "Minimum values cannot exceed maximum values" })

export const userDeadlineSchema = z.object({
  universityId: z.coerce.number().int().positive(),
  deadlineType: z.enum(["application", "scholarship", "document"]),
  important: z.boolean().default(false),
  note: nullableString(1000),
})

export const checklistPatchSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.coerce.number().int().positive().optional(),
        title: cleanString(180),
        completed: z.boolean().default(false),
        dueDate: nullableDate,
      }),
    )
    .max(40),
})

export const contactSchema = z.object({
  name: cleanString(120),
  email: z.string().trim().email().max(200),
  universityOfInterest: nullableString(180),
  subject: cleanString(180),
  message: cleanString(4000),
})

export const studentCouncilCreateSchema = z.object({
  universityId: z.coerce.number().int().positive(),
  name: cleanString(180),
  officialName: nullableString(220),
  description: cleanString(4000),
  websiteUrl: nullableUrl(800),
  socialUrl: nullableUrl(800),
  contactEmail: z
    .union([z.string().trim().email().max(200), z.literal(""), z.null()])
    .optional()
    .transform((value) => (value === "" ? null : value)),
  sourceUrl: nullableUrl(800),
  verificationStatus: verificationStatus.default("needs verification"),
  lastVerifiedAt: nullableDate,
})

export const studentCouncilUpdateSchema = studentCouncilCreateSchema
  .omit({ universityId: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update",
  })

export const studentCouncilRoleCreateSchema = z.object({
  councilId: z.coerce.number().int().positive(),
  universityId: z.coerce.number().int().positive(),
  adminUserId: z.coerce.number().int().positive().nullable().optional(),
  displayName: nullableString(180),
  roleTitle: cleanString(180),
  department: nullableString(180),
  description: nullableString(2000),
  responsibilities: z.array(cleanString(220)).max(20).default([]),
  contactEmail: z
    .union([z.string().trim().email().max(200), z.literal(""), z.null()])
    .optional()
    .transform((value) => (value === "" ? null : value)),
  contactUrl: nullableUrl(800),
  avatarUrl: nullableUrl(800),
  status: roleStatus.default("pending"),
  verificationStatus: verificationStatus.default("needs verification"),
  sourceUrl: nullableUrl(800),
})

export const studentCouncilRoleUpdateSchema = studentCouncilRoleCreateSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update",
  })

export const moderatorProfileSchema = z
  .object({
    displayName: cleanString(180),
    description: nullableString(2000),
    defaultRole: nullableString(180),
    avatarUrl: nullableUrl(800),
    contactEmail: z
      .union([z.string().trim().email().max(200), z.literal(""), z.null()])
      .optional()
      .transform((value) => (value === "" ? null : value)),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update",
  })

export const communityCategories = [
  "Admissions",
  "Visa",
  "Dormitory",
  "Life in Korea",
  "University Reviews",
  "Program Questions",
  "Korean Language",
  "Jobs / Internships",
  "Student Council",
  "Documents",
  "Deadlines",
  "General Questions",
]

const communityStatus = z.enum(["published", "pending", "hidden", "reported", "removed"])
const commentStatus = z.enum(["published", "pending", "hidden", "reported", "removed"])
const reportReason = z.enum(["spam", "harassment", "misinformation", "unsafe", "off-topic", "other"])
const notificationPriority = z.enum(["low", "normal", "high", "urgent"])
const applicationStatus = z.enum([
  "Interested",
  "Preparing Documents",
  "Ready to Apply",
  "Applied",
  "Waiting for Result",
  "Interview Scheduled",
  "Accepted",
  "Rejected",
  "Deferred",
  "Enrolled",
  "Withdrawn",
])
const documentStatus = z.enum(["missing", "preparing", "ready", "submitted", "expired"])
const calendarStatus = z.enum(["upcoming", "completed", "overdue", "cancelled"])
const calendarEventType = z.enum([
  "application_deadline",
  "roadmap_task",
  "document_deadline",
  "visa_deadline",
  "interview",
  "reminder",
  "custom",
])

export const communityPostCreateSchema = z.object({
  title: cleanString(180),
  content: cleanString(8000),
  category: z.enum(communityCategories),
  universityId: z.coerce.number().int().positive().nullable().optional(),
  relatedProgram: nullableString(180),
  tags: z.array(cleanString(40)).max(10).default([]),
})

export const communityPostUpdateSchema = communityPostCreateSchema.partial().strict().refine((data) => Object.keys(data).length > 0, { message: "At least one post field is required" })

export const communityCommentCreateSchema = z.object({
  content: cleanString(4000),
  parentCommentId: z.coerce.number().int().positive().nullable().optional(),
})

export const communityCommentUpdateSchema = z.object({ content: cleanString(4000) }).strict()

export const communityReportSchema = z.object({
  reason: reportReason.default("other"),
  details: nullableString(2000),
  commentId: z.coerce.number().int().positive().nullable().optional(),
})

export const moderationStatusSchema = z
  .object({
    status: z.enum(["published", "pending", "hidden", "reported", "removed", "approved", "rejected", "active", "inactive"]),
    pinned: z.boolean().optional(),
    official: z.boolean().optional(),
    officialAnswer: nullableString(4000),
    note: nullableString(2000),
  })
  .partial({ pinned: true, official: true, officialAnswer: true, note: true })

export const internalNoteSchema = z.object({
  targetEntity: cleanString(80),
  targetEntityId: z.coerce.number().int().positive().nullable().optional(),
  note: cleanString(3000),
})

export const moderatorAnnouncementSchema = z.object({
  title: cleanString(180),
  message: cleanString(3000),
  type: cleanString(80).default("moderator_announcement"),
  priority: notificationPriority.default("normal"),
  linkUrl: nullableString(500),
  userIds: z.array(z.coerce.number().int().positive()).max(500).optional(),
})

export const moderatorRoleSchema = z.object({
  role: z.enum(["admin", "moderator", "university_editor", "content_editor", "community_moderator"]),
})

export const analyticsEventSchema = z.object({
  userId: z.coerce.number().int().positive().nullable().optional(),
  sessionId: nullableString(120),
  eventType: cleanString(80),
  entityType: nullableString(80),
  entityId: z.coerce.number().int().positive().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
})

export const managedContentKinds = ["news", "forum", "qa", "members"]
export const managedContentSchema = z
  .object({
    payload: z.array(z.record(z.string(), z.unknown())).max(500),
  })
  .strict()
  .superRefine((value, context) => {
    if (Buffer.byteLength(JSON.stringify(value.payload), "utf8") > 512_000) {
      context.addIssue({ code: "custom", path: ["payload"], message: "Managed content cannot exceed 512 KB" })
    }
  })

export const onboardingSchema = z.object({
  desiredMajor: nullableString(140),
  degreeLevel: nullableString(80),
  preferredCity: nullableString(120),
  languagePreference: nullableString(80),
  budgetMin: nullableInt,
  budgetMax: nullableInt,
  qsRankMin: nullableInt,
  qsRankMax: nullableInt,
  dormitoryRequired: nullableBoolean,
  scholarshipPreference: nullableString(80),
  targetIntake: nullableString(80),
  educationLevel: nullableString(120),
  preparationStage: nullableString(120),
  nationality: nullableString(120),
  testStatus: nullableString(180),
  onboardingCompleted: z.boolean().default(false),
}).refine((data) => (data.budgetMin == null || data.budgetMax == null || data.budgetMin <= data.budgetMax) && (data.qsRankMin == null || data.qsRankMax == null || data.qsRankMin <= data.qsRankMax), { message: "Minimum onboarding values cannot exceed maximum values" })

export const onboardingPatchSchema = z.object(onboardingSchema.shape).partial().refine((data) => Object.keys(data).length > 0, {
  message: "At least one onboarding field is required",
})

export const applicationCreateSchema = z.object({
  universityId: z.coerce.number().int().positive(),
  programId: nullableString(180),
  status: applicationStatus.default("Interested"),
  intake: nullableString(80),
  applicationDeadline: nullableDate,
  submittedDate: nullableDate,
  resultDate: nullableDate,
  notes: nullableString(3000),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
}).refine((data) => !data.submittedDate || !data.resultDate || data.submittedDate <= data.resultDate, { message: "Result date cannot precede submission date", path: ["resultDate"] })

export const applicationUpdateSchema = z.object(applicationCreateSchema.shape)
  .omit({ universityId: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one application field is required",
  })

export const userDocumentCreateSchema = z.object({
  applicationId: z.coerce.number().int().positive().nullable().optional(),
  checklistItemId: z.coerce.number().int().positive().nullable().optional(),
  documentType: z.enum([
    "Passport",
    "Transcript",
    "Diploma",
    "Recommendation Letter",
    "Personal Statement",
    "Language Certificate",
    "Financial Proof",
    "ID Photo",
    "Application Form",
    "Portfolio",
    "Visa Documents",
    "Other",
  ]),
  title: cleanString(180),
  status: documentStatus.default("missing"),
  fileName: nullableString(240),
  fileType: nullableString(120),
  fileSize: nullableInt,
  expirationDate: nullableDate,
  notes: nullableString(2000),
}).strict()

export const userDocumentUpdateSchema = userDocumentCreateSchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: "At least one document field is required",
})

export const calendarEventCreateSchema = z.object({
  title: cleanString(180),
  description: nullableString(2000),
  eventType: calendarEventType.default("custom"),
  startDate: z.coerce.date(),
  endDate: nullableDate,
  allDay: z.boolean().default(true),
  universityId: z.coerce.number().int().positive().nullable().optional(),
  programId: nullableString(180),
  applicationId: z.coerce.number().int().positive().nullable().optional(),
  checklistItemId: z.coerce.number().int().positive().nullable().optional(),
  roadmapStepId: nullableString(120),
  status: calendarStatus.default("upcoming"),
})

export const calendarEventUpdateSchema = calendarEventCreateSchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: "At least one calendar field is required",
})

function zodIssuesToDetails(error) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }))
}

export function validateBody(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body)

    if (!parsed.success) {
      next(new ApiError(400, "Validation failed", zodIssuesToDetails(parsed.error)))
      return
    }

    req.body = req.method === "PATCH" || req.method === "PUT"
      ? Object.fromEntries(Object.entries(parsed.data).filter(([key]) => Object.hasOwn(req.body, key)))
      : parsed.data
    next()
  }
}

export function parseUniversityQuery(query) {
  const parsed = universityQuerySchema.safeParse(query)

  if (!parsed.success) {
    throw new ApiError(400, "Invalid query parameters", zodIssuesToDetails(parsed.error))
  }

  return parsed.data
}

export function parseCompareQuery(query) {
  const parsed = compareQuerySchema.safeParse(query)

  if (!parsed.success) {
    throw new ApiError(400, "Invalid comparison query", zodIssuesToDetails(parsed.error))
  }

  return parsed.data
}

const programShape = {
  universityId: z.coerce.number().int().positive(),
  slug: z.string().trim().min(3).max(220).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: cleanString(180), degreeLevel: cleanString(80), languageOfInstruction: cleanString(80),
  tuitionMin: nullableInt, tuitionMax: nullableInt, tuitionCurrency: cleanString(12).default('KRW'),
  duration: nullableString(180), requirements: stringArray.default([]), requiredDocuments: stringArray.default([]),
  applicationPeriod: nullableString(500), careerOutcomes: stringArray.default([]), officialLink: nullableUrl(800),
}
export const programCreateSchema = z.object(programShape).refine(hasValidTuitionRange, { message: 'Minimum tuition cannot exceed maximum tuition' })
export const programUpdateSchema = z.object(programShape).partial().refine(hasValidTuitionRange, { message: 'Minimum tuition cannot exceed maximum tuition' })
