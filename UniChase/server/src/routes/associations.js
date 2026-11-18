import { Router, raw } from "express"
import { z } from "zod"
import { requireStudent } from "../auth.js"
import { ApiError, asyncHandler } from "../errors.js"
import { parsePositiveId } from "../universityQuery.js"
import { validateBody } from "../validation.js"

const text = (max) => z.string().trim().min(1).max(max)
const httpsUrl = z.url({ protocol: /^https$/ }).max(2048).refine((value) => {
  if (!URL.canParse(value)) return false
  const url = new URL(value)
  return !url.username && !url.password
}, "Use an HTTPS URL without credentials").nullable()
const imageId = z.uuid().nullable()
const order = z.number().int().min(0).max(10000)
const verification = z.enum(["verified", "needs verification", "manually added"])
const social = { telegramUrl: httpsUrl, instagramUrl: httpsUrl, linkedinUrl: httpsUrl }

const profileSchema = z.object({
  name: text(80),
  officialName: text(180),
  description: text(5000),
  associationEnabled: z.boolean(),
  logoUrl: httpsUrl,
  imageId,
  foundedYear: z.number().int().min(1800).max(new Date().getUTCFullYear()).nullable(),
  memberCount: z.number().int().nonnegative().max(1_000_000).nullable(),
  verificationStatus: verification,
  ...social,
}).strict()

const memberSchema = z.object({
  displayName: text(160),
  roleTitle: text(120),
  roleShort: text(20).nullable(),
  academicYear: text(80).nullable(),
  major: text(120).nullable(),
  avatarUrl: httpsUrl,
  imageId,
  status: z.enum(["active", "inactive", "pending"]),
  verificationStatus: verification,
  displayOrder: order,
  ...social,
}).strict()

const advisorSchema = z.object({
  name: text(160),
  major: text(120),
  academicYear: text(80).nullable(),
  photoUrl: httpsUrl,
  imageId,
  contactUrl: httpsUrl,
  active: z.boolean(),
  displayOrder: order,
  verificationStatus: verification,
}).strict()

const feedSchema = z.object({
  type: z.enum(["EVENT", "POST", "INTERVIEW"]),
  title: text(180),
  description: text(1000),
  body: text(20000).nullable(),
  imageUrl: httpsUrl,
  imageId,
  date: z.iso.date().transform((value) => new Date(value + "T00:00:00Z")),
  externalUrl: httpsUrl,
  published: z.boolean(),
}).strict()

const questionSchema = z.object({ body: text(2000) }).strict()
const questionStatusSchema = z.object({ handled: z.boolean() }).strict()
const namedMember = { status: "active", displayName: { notIn: ["", "Full Name"], not: null } }
const orderedPeople = [{ displayOrder: "asc" }, { id: "asc" }]
const orderedFeed = [{ date: "desc" }, { id: "desc" }]

const profileFields = {
  id: true, universityId: true, name: true, officialName: true, description: true,
  logoUrl: true, imageId: true, foundedYear: true, memberCount: true, verificationStatus: true,
  telegramUrl: true, instagramUrl: true, linkedinUrl: true, associationEnabled: true,
  university: { select: { name: true } },
}
const memberFields = {
  id: true, displayName: true, roleTitle: true, roleShort: true, major: true, academicYear: true,
  avatarUrl: true, imageId: true, status: true, verificationStatus: true, displayOrder: true,
  telegramUrl: true, instagramUrl: true, linkedinUrl: true,
}
const advisorFields = {
  id: true, name: true, major: true, academicYear: true, photoUrl: true, imageId: true,
  contactUrl: true, active: true, verificationStatus: true, displayOrder: true,
}
const feedFields = {
  id: true, type: true, title: true, description: true, body: true, imageUrl: true,
  imageId: true, date: true, externalUrl: true, published: true,
}

function associationFields(isPublic) {
  return {
    ...profileFields,
    roles: { select: memberFields, orderBy: orderedPeople, where: isPublic ? namedMember : undefined },
    advisors: { select: advisorFields, orderBy: orderedPeople, where: isPublic ? { active: true } : undefined },
    content: { select: feedFields, orderBy: orderedFeed, where: isPublic ? { published: true } : undefined },
  }
}

function universitySelector(identifier) {
  return /^\d+$/.test(identifier) ? { id: parsePositiveId(identifier) } : { slug: identifier }
}

function sendImage(res, image, isPublic) {
  if (!image) throw new ApiError(404, "Image not found")
  res.set("Cross-Origin-Resource-Policy", "cross-origin")
  res.set("Cache-Control", isPublic ? "no-cache" : "private, no-store")
  res.type(image.contentType).send(Buffer.from(image.bytes))
}

function imageContentType(bytes) {
  if (!Buffer.isBuffer(bytes)) return null
  if (bytes.length >= 4 && bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "image/jpeg"
  if (bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png"
  if (bytes.length >= 16 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "image/webp"
  return null
}

export function createAssociationRouter(prisma) {
  const router = Router()

  router.get("/images/:id", asyncHandler(async (req, res) => {
    const image = await prisma.associationImage.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { councils: { some: { associationEnabled: true } } },
          { members: { some: { ...namedMember, council: { associationEnabled: true } } } },
          { advisors: { some: { active: true, council: { associationEnabled: true } } } },
          { content: { some: { published: true, council: { associationEnabled: true } } } },
        ],
      },
    })
    sendImage(res, image, true)
  }))

  router.get("/universities/:university", asyncHandler(async (req, res) => {
    const association = await prisma.studentCouncil.findFirst({
      where: { associationEnabled: true, university: universitySelector(req.params.university) },
      select: associationFields(true),
    })
    res.json({ data: association })
  }))

  router.post("/:councilId/advisors/:advisorId/questions", requireStudent(prisma), validateBody(questionSchema),
    asyncHandler(async (req, res) => {
      const data = await prisma.$transaction(async (db) => {
        const advisor = await db.majorAdvisor.findFirst({
          where: {
            id: parsePositiveId(req.params.advisorId), councilId: parsePositiveId(req.params.councilId),
            active: true, council: { associationEnabled: true },
          },
          include: { council: { select: { name: true, university: { select: { name: true } } } } },
        })
        if (!advisor) throw new ApiError(404, "This advisor is no longer available.")
        return db.advisorQuestion.create({
          data: {
            studentId: req.user.id, advisorId: advisor.id, councilId: advisor.councilId,
            advisorName: advisor.name, advisorMajor: advisor.major, associationName: advisor.council.name,
            universityName: advisor.council.university.name, body: req.body.body,
          },
          select: { id: true },
        })
      })
      res.status(201).json({ data })
    }),
  )

  return router
}

export function createModeratorAssociationRouter(prisma) {
  const router = Router()

  router.get("/images/:id", asyncHandler(async (req, res) => {
    const image = await prisma.associationImage.findUnique({ where: { id: req.params.id } })
    sendImage(res, image, false)
  }))

  router.post("/images", raw({ type: ["image/jpeg", "image/png", "image/webp"], limit: "2mb" }),
    asyncHandler(async (req, res) => {
      const contentType = imageContentType(req.body)
      if (!contentType || !req.is(contentType)) throw new ApiError(415, "Choose a JPEG, PNG, or WebP image.")
      const data = await prisma.associationImage.create({
        data: { contentType, bytes: req.body }, select: { id: true },
      })
      res.status(201).json({ data })
    }),
  )

  router.get("/questions", asyncHandler(async (req, res) => {
    const status = req.query.status
    if (status !== "open" && status !== "handled") throw new ApiError(400, "Choose open or handled questions.")
    const cursor = req.query.before ? parsePositiveId(req.query.before) : undefined
    const data = await prisma.advisorQuestion.findMany({
      where: { handledAt: status === "open" ? null : { not: null }, id: cursor ? { lt: cursor } : undefined },
      include: { student: { select: { name: true, email: true } } },
      orderBy: { id: "desc" }, take: 26,
    })
    res.set("Cache-Control", "private, no-store")
    res.json({ data: data.slice(0, 25), next: data.length > 25 ? data[24].id : null })
  }))

  router.patch("/questions/:id", validateBody(questionStatusSchema), asyncHandler(async (req, res) => {
    const data = await prisma.advisorQuestion.update({
      where: { id: parsePositiveId(req.params.id) },
      data: { handledAt: req.body.handled ? new Date() : null },
      select: { id: true },
    })
    res.json({ data })
  }))

  router.get("/universities/:universityId", asyncHandler(async (req, res) => {
    const data = await prisma.studentCouncil.findUnique({
      where: { universityId: parsePositiveId(req.params.universityId) }, select: associationFields(false),
    })
    res.json({ data })
  }))

  router.put("/universities/:universityId", validateBody(profileSchema), asyncHandler(async (req, res) => {
    const universityId = parsePositiveId(req.params.universityId)
    const data = await prisma.studentCouncil.upsert({
      where: { universityId }, create: { ...req.body, universityId }, update: req.body,
      select: associationFields(false),
    })
    res.json({ data })
  }))

  const collections = [
    { path: "members", model: prisma.studentCouncilRole, schema: memberSchema, select: memberFields },
    { path: "advisors", model: prisma.majorAdvisor, schema: advisorSchema, select: advisorFields },
    { path: "content", model: prisma.associationContent, schema: feedSchema, select: feedFields },
  ]

  for (const { path, model, schema, select } of collections) {
    const base = "/:councilId/" + path
    router.post(base, validateBody(schema), asyncHandler(async (req, res) => {
      const council = await prisma.studentCouncil.findUnique({
        where: { id: parsePositiveId(req.params.councilId) }, select: { id: true, universityId: true },
      })
      if (!council) throw new ApiError(404, "Association not found")
      const data = await model.create({
        data: { ...req.body, councilId: council.id, ...(path === "members" ? { universityId: council.universityId } : {}) },
        select,
      })
      res.status(201).json({ data })
    }))
    router.put(base + "/:id", validateBody(schema), asyncHandler(async (req, res) => {
      const data = await model.update({
        where: { id: parsePositiveId(req.params.id), councilId: parsePositiveId(req.params.councilId) },
        data: req.body, select,
      })
      res.json({ data })
    }))
    router.delete(base + "/:id", asyncHandler(async (req, res) => {
      await model.delete({
        where: { id: parsePositiveId(req.params.id), councilId: parsePositiveId(req.params.councilId) },
      })
      res.json({ data: null })
    }))
  }

  router.use((error, req, res, next) => {
    if (error.code === "P2025") return next(new ApiError(404, "Record not found"))
    if (error.code === "P2003") return next(new ApiError(400, "A referenced university, association, or image no longer exists."))
    next(error)
  })

  return router
}
