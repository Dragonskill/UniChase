import { afterEach, describe, expect, it } from "vitest"
import { costEstimateSchema, eligibilitySchema, evaluateEligibility, optionalDate } from "../src/routes/studentTools.js"
import { dispatchStudentReminders, reminderDeliveryStatus } from "../src/services/studentReminders.js"

describe("student tool validation and preparation scoring", () => {
  it("keeps a missing optional date null instead of converting it to the Unix epoch", () => {
    expect(optionalDate.parse(null)).toBeNull()
    expect(optionalDate.parse("")).toBeNull()
  })

  it("does not award preparation credit for missing funding or language evidence", () => {
    const data = eligibilitySchema.parse({
      targetProgram: "Computer Science",
      degreeLevel: "undergraduate",
      hasTranscript: true,
      hasPassport: true,
      hasStudyPlan: true,
    })
    const result = evaluateEligibility(data)
    expect(result.status).not.toBe("ready-to-verify")
    expect(result.missingRequirements).toEqual(expect.arrayContaining([
      expect.stringContaining("budget"),
      expect.stringContaining("Language"),
    ]))
    expect(result.missingRequirements.join(" ")).not.toContain("Recommendation")
  })

  it("requires recommendation readiness for an explicit graduate level", () => {
    const result = evaluateEligibility(eligibilitySchema.parse({
      targetProgram: "Computer Science", degreeLevel: "master", gpa: 4,
      englishScore: "IELTS entered", budget: 1000, hasTranscript: true,
      hasPassport: true, hasStudyPlan: true, hasRecommendation: false,
    }))
    expect(result.missingRequirements.join(" ")).toContain("Recommendation")
  })

  it("rejects unbounded monetary inputs", () => {
    expect(() => costEstimateSchema.parse({ name: "Test", tuitionPerSemester: 100000001 })).toThrow()
  })
})

describe("email reminder delivery", () => {
  const previous = { ...process.env }
  afterEach(() => { process.env = { ...previous } })

  it("reports delivery disabled unless all required settings exist", () => {
    process.env.EMAIL_REMINDERS_ENABLED = "false"
    delete process.env.SMTP_HOST
    expect(reminderDeliveryStatus().configured).toBe(false)
  })

  it("claims a due reminder exactly once before sending", async () => {
    const updates = []
    let available = true
    const prisma = {
      scheduledReminder: {
        findMany: async () => [{ id: 9, userId: 2, type: "roadmapStep", title: "Submit", metadata: { dueDate: "2027-01-01" } }],
        updateMany: async ({ data }) => { updates.push(data.status); if (!available) return { count: 0 }; available = false; return { count: 1 } },
        update: async ({ data }) => { updates.push(data.status) },
      },
      reminderPreference: { findUnique: async () => ({ emailEnabled: true, roadmapStep: true }) },
      studentUser: { findUnique: async () => ({ email: "student@example.com" }) },
    }
    let sends = 0
    const transport = { sendMail: async () => { sends += 1 } }
    await dispatchStudentReminders(prisma, transport)
    await dispatchStudentReminders(prisma, transport)
    expect(sends).toBe(1)
    expect(updates).toEqual(expect.arrayContaining(["sending", "sent"]))
  })
})
