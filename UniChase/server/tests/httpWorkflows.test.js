import express from "express"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import { signAdminToken, signStudentToken } from "../src/auth.js"
import { eventsToIcs } from "../src/calendar.js"
import { errorHandler } from "../src/errors.js"
import { createModeratorRouter } from "../src/routes/moderator.js"
import { createUserRouter } from "../src/routes/user.js"

const previousSecret = process.env.JWT_SECRET
beforeAll(() => { process.env.JWT_SECRET = "test-only-secret-with-at-least-32-characters" })
afterAll(() => {
  if (previousSecret === undefined) delete process.env.JWT_SECRET
  else process.env.JWT_SECRET = previousSecret
})

async function request(router, path, { method = "GET", token, body } = {}) {
  const app = express()
  app.use(express.json())
  app.use(router)
  app.use(errorHandler)
  const server = await new Promise((resolve) => {
    const value = app.listen(0, "127.0.0.1", () => resolve(value))
  })
  try {
    const { port } = server.address()
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers: { authorization: `Bearer ${token}`, ...(body ? { "content-type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    })
    const text = await response.text()
    return { status: response.status, body: text ? JSON.parse(text) : null }
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
}

const university = {
  id: 21,
  name: "Test University",
  slug: "test-university",
  city: "Seoul",
  country: "South Korea",
  officialWebsite: "https://example.edu",
  description: "Test university",
  programs: [],
  languagesOfInstruction: [],
  admissionRequirements: [],
  requiredDocuments: [],
  applicationSteps: [],
  studyLevels: [],
  tags: [],
  sourceUrls: [],
  mainColor: "#15397F",
}

describe("follow, moderation, and calendar workflows", () => {
  it("creates a follow scoped to the authenticated account", async () => {
    const upsert = vi.fn().mockResolvedValue({ userId: 1, universityId: 21, university, createdAt: new Date() })
    const prisma = {
      studentUser: { findUnique: vi.fn().mockResolvedValue({ id: 1, email: "student@example.com", name: "Student" }) },
      university: { findUnique: vi.fn().mockResolvedValue({ id: 21 }) },
      followedUniversity: { upsert },
    }

    const response = await request(createUserRouter(prisma), "/followed-universities", {
      method: "POST",
      token: signStudentToken({ id: 1, email: "student@example.com" }),
      body: { universityId: 21 },
    })

    expect(response.status).toBe(201)
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId_universityId: { userId: 1, universityId: 21 } },
      create: { userId: 1, universityId: 21 },
    }))
  })

  it("persists an actual review moderation transition and audit event", async () => {
    const update = vi.fn().mockResolvedValue({ id: 12, status: "approved" })
    const activity = vi.fn().mockResolvedValue({ id: 1 })
    const prisma = {
      adminUser: { findUnique: vi.fn().mockResolvedValue({ id: 7, email: "mod@example.com", role: "moderator" }) },
      universityReview: { update },
      moderatorActivityLog: { create: activity },
    }
    prisma.$transaction = callback => callback(prisma)

    const response = await request(createModeratorRouter(prisma), "/reviews/12/status", {
      method: "PATCH",
      token: signAdminToken({ id: 7, email: "mod@example.com", role: "admin" }),
      body: { status: "approved", note: "Checked" },
    })

    expect(response.status).toBe(200)
    expect(update).toHaveBeenCalledWith({ where: { id: 12 }, data: { status: "approved" } })
    expect(activity).toHaveBeenCalledWith({ data: expect.objectContaining({ actionType: "moderate_review", targetEntityId: 12 }) })
  })

  it("rejects a calendar event linked to another user's application", async () => {
    const create = vi.fn()
    const prisma = {
      studentUser: { findUnique: vi.fn().mockResolvedValue({ id: 1, email: "student@example.com", name: "Student" }) },
      userApplication: { findFirst: vi.fn().mockResolvedValue(null) },
      calendarEvent: { create },
    }
    const response = await request(createUserRouter(prisma), "/calendar/events", {
      method: "POST",
      token: signStudentToken({ id: 1, email: "student@example.com" }),
      body: { title: "Deadline", eventType: "application_deadline", startDate: "2026-10-01", applicationId: 51 },
    })

    expect(response.status).toBe(404)
    expect(create).not.toHaveBeenCalled()
  })

  it("exports all-day events as DATE values with an exclusive end date", () => {
    const ics = eventsToIcs([{
      id: 8,
      title: "Application deadline",
      eventType: "application_deadline",
      startDate: new Date("2026-10-02T00:00:00.000Z"),
      allDay: true,
    }], new Date("2026-09-01T00:00:00.000Z"))

    expect(ics).toContain("DTSTART;VALUE=DATE:20261002")
    expect(ics).toContain("DTEND;VALUE=DATE:20261003")
    expect(ics).toContain("DTSTAMP:20260901T000000Z")
  })
})
