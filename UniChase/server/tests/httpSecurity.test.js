import express from "express"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import { signAdminToken, signStudentToken } from "../src/auth.js"
import { errorHandler } from "../src/errors.js"
import { createAnalyticsRouter } from "../src/routes/analytics.js"
import { createCommunityRouter } from "../src/routes/community.js"
import { createModeratorRouter } from "../src/routes/moderator.js"
import { createUserRouter } from "../src/routes/user.js"

const secretBeforeTests = process.env.JWT_SECRET
beforeAll(() => { process.env.JWT_SECRET = "test-only-secret-with-at-least-32-characters" })
afterAll(() => {
  if (secretBeforeTests === undefined) delete process.env.JWT_SECRET
  else process.env.JWT_SECRET = secretBeforeTests
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
    const address = server.address()
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
      method,
      headers: {
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(body ? { "content-type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    const text = await response.text()
    return { status: response.status, body: text ? JSON.parse(text) : null, headers: response.headers }
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
}

function studentPrisma(overrides = {}) {
  return {
    studentUser: { findUnique: vi.fn().mockResolvedValue({ id: 1, email: "student@example.com", name: "Student" }) },
    ...overrides,
  }
}

function adminPrisma(role, overrides = {}) {
  return {
    adminUser: { findUnique: vi.fn().mockResolvedValue({ id: 7, email: "staff@example.com", role }) },
    ...overrides,
  }
}

describe("HTTP authorization and ownership boundaries", () => {
  it("rejects a signed student token whose subject is not a database id", async () => {
    const prisma = studentPrisma({ followedUniversity: { findMany: vi.fn() } })
    const token = signStudentToken({ id: "not-an-id", email: "student@example.com" })

    const response = await request(createUserRouter(prisma), "/followed-universities", { token })

    expect(response.status).toBe(401)
    expect(prisma.studentUser.findUnique).not.toHaveBeenCalled()
  })

  it("uses the current admin role from the database for university RBAC", async () => {
    const prisma = adminPrisma("content_editor", { university: { create: vi.fn() } })
    const token = signAdminToken({ id: 7, email: "staff@example.com", role: "admin" })

    const response = await request(createModeratorRouter(prisma), "/universities", {
      method: "POST",
      token,
      body: {},
    })

    expect(response.status).toBe(403)
    expect(prisma.university.create).not.toHaveBeenCalled()
  })

  it("does not let a post author set moderation or official-answer fields", async () => {
    const update = vi.fn()
    const prisma = studentPrisma({
      communityPost: {
        findUnique: vi.fn().mockResolvedValue({ id: 3, authorId: 1, status: "published" }),
        update,
      },
    })
    const token = signStudentToken({ id: 1, email: "student@example.com" })

    const response = await request(createCommunityRouter(prisma), "/posts/3", {
      method: "PATCH",
      token,
      body: { status: "published", pinned: true, officialAnswer: "Official" },
    })

    expect(response.status).toBe(400)
    expect(update).not.toHaveBeenCalled()
  })

  it("rejects document links to another user's application before writing", async () => {
    const create = vi.fn()
    const prisma = studentPrisma({
      userApplication: { findFirst: vi.fn().mockResolvedValue(null) },
      userDocument: { create },
    })
    const token = signStudentToken({ id: 1, email: "student@example.com" })

    const response = await request(createUserRouter(prisma), "/documents", {
      method: "POST",
      token,
      body: { documentType: "Passport", title: "Passport", applicationId: 99 },
    })

    expect(response.status).toBe(404)
    expect(prisma.userApplication.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 99, userId: 1 } }))
    expect(create).not.toHaveBeenCalled()
  })

  it("records authenticated analytics under the token user instead of a supplied user id", async () => {
    const create = vi.fn().mockResolvedValue({ id: 4 })
    const prisma = studentPrisma({ analyticsEvent: { create } })
    const token = signStudentToken({ id: 1, email: "student@example.com" })

    const response = await request(createAnalyticsRouter(prisma), "/event", {
      method: "POST",
      token,
      body: { userId: 999, eventType: "search", metadata: {} },
    })

    expect(response.status).toBe(201)
    expect(create).toHaveBeenCalledWith({ data: expect.objectContaining({ userId: 1 }) })
  })
})
