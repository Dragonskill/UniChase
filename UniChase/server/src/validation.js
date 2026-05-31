import { z } from "zod"
import { ApiError } from "./errors.js"

const cleanString = (maxLength) => z.string().trim().min(1).max(maxLength)
const stringArray = z.array(cleanString(140)).max(80)
const nullableString = (maxLength) =>
  z
    .union([cleanString(maxLength), z.literal(""), z.null()])
    .optional()
    .transform((value) => {
      if (value === "" || value === undefined) {
        return null
      }

      return value
    })

const nullableInt = z
  .union([z.coerce.number().int().nonnegative(), z.null()])
  .optional()
  .transform((value) => value ?? null)

const nullableBoolean = z
  .union([z.boolean(), z.literal("true"), z.literal("false"), z.literal("1"), z.literal("0"), z.null()])
  .optional()
  .transform((value) => {
    if (value === null || value === undefined) {
      return null
    }

    if (typeof value === "boolean") {
      return value
    }

    return ["true", "1"].includes(value)
  })

const nullableDate = z
  .union([z.coerce.date(), z.literal(""), z.null()])
  .optional()
  .transform((value) => {
    if (value === "" || value === undefined) {
      return null
    }

    return value
  })

const optionalPositiveInt = z.coerce.number().int().positive().optional()

const universityBaseShape = {
  name: cleanString(180),
  slug: nullableString(220),
  koreanName: nullableString(180),
  city: cleanString(120),
  country: cleanString(120),
  universityType: z.enum(["public", "private"]).default("private"),
  qsRanking: nullableInt,
  qsRankingYear: nullableInt,
  rankingSourceNote: nullableString(800),
  officialWebsite: z.string().trim().url().max(500),
  imageUrl: z.string().trim().url().max(800),
  logoUrl: z.string().trim().url().max(800),
  description: cleanString(4000),
  programs: stringArray.min(1),
  tuitionMin: nullableInt,
  tuitionMax: nullableInt,
  tuitionCurrency: cleanString(12),
  admissionRequirements: stringArray,
  languagesOfInstruction: stringArray.min(1),
  scholarshipInfo: nullableString(2000),
  hasScholarships: z.boolean(),
  hasDormitory: z.boolean(),
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
      if (value === "" || value === undefined) {
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
    country: universityBaseShape.country.default("South Korea"),
    tuitionCurrency: universityBaseShape.tuitionCurrency.default("KRW"),
    admissionRequirements: universityBaseShape.admissionRequirements.default([]),
    hasScholarships: universityBaseShape.hasScholarships.default(false),
    hasDormitory: universityBaseShape.hasDormitory.default(false),
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

export const adminLoginSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(8).max(200),
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
  })
  .strip()

export const userRegisterSchema = z.object({
  name: cleanString(120),
  email: z.string().trim().email().max(200).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(200),
})

export const userLoginSchema = z.object({
  email: z.string().trim().email().max(200).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(200),
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
  })

export const savedUniversitySchema = z.object({
  universityId: z.coerce.number().int().positive(),
  notes: nullableString(1000),
})

export const compareQuerySchema = z.object({
  ids: z
    .string()
    .trim()
    .min(1)
    .transform((value) =>
      value
        .split(",")
        .map((id) => Number(id.trim()))
        .filter((id) => Number.isInteger(id) && id > 0),
    )
    .refine((ids) => ids.length >= 2 && ids.length <= 4, {
      message: "Compare requires 2 to 4 university ids",
    }),
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
})

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

    req.body = parsed.data
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
