import { describe, expect, it } from "vitest"
import {
  compareQuerySchema,
  parseUniversityQuery,
  recommendationSchema,
  universityCreateSchema,
  universityUpdateSchema,
  userDocumentCreateSchema,
  userProfileSchema,
} from "../src/validation.js"

const validUniversity = {
  name: "Test University",
  city: "Seoul",
  officialWebsite: "https://example.edu",
  imageUrl: "https://example.edu/image.jpg",
  logoUrl: "https://example.edu/logo.svg",
  description: "A useful test university profile.",
  programs: ["Engineering"],
  languagesOfInstruction: ["English"],
}

describe("university validation", () => {
  it("fills safe defaults for a valid university create request", () => {
    const parsed = universityCreateSchema.parse(validUniversity)

    expect(parsed.country).toBe("South Korea")
    expect(parsed.tuitionCurrency).toBe("KRW")
    expect(parsed.hasScholarships).toBeNull()
    expect(parsed.hasDormitory).toBeNull()
    expect(parsed.mainColor).toBe("#15397F")
  })

  it("rejects invalid tuition ranges", () => {
    const parsed = universityCreateSchema.safeParse({
      ...validUniversity,
      tuitionMin: 9000,
      tuitionMax: 1000,
    })

    expect(parsed.success).toBe(false)
  })

  it("normalizes filter query values", () => {
    const parsed = parseUniversityQuery({
      city: "Seoul",
      maxRanking: "100",
      scholarship: "true",
    })

    expect(parsed).toEqual({
      city: "Seoul",
      maxRanking: 100,
      scholarship: true,
    })
  })

  it("preserves explicit nulls without coercing them to zero or the Unix epoch", () => {
    const profile = userProfileSchema.parse({ preferredMajor: null, budgetMin: null })
    const university = universityUpdateSchema.parse({ applicationDeadline: null, qsRanking: null })

    expect(profile).toEqual({ preferredMajor: null, budgetMin: null })
    expect(university).toEqual({ applicationDeadline: null, qsRanking: null })
  })

  it("does not synthesize omitted fields during partial updates", () => {
    expect(userProfileSchema.parse({ name: "Updated name" })).toEqual({ name: "Updated name" })
    expect(universityUpdateSchema.parse({ city: "Busan" })).toEqual({ city: "Busan" })
  })

  it("rejects duplicate or partially malformed comparison ids", () => {
    expect(compareQuerySchema.safeParse({ ids: "1,1" }).success).toBe(false)
    expect(compareQuerySchema.safeParse({ ids: "1,nope,2" }).success).toBe(false)
    expect(compareQuerySchema.parse({ ids: "1,2,3" }).ids).toEqual([1, 2, 3])
  })

  it("rejects inverse recommendation ranges and public document URLs", () => {
    expect(recommendationSchema.safeParse({ tuitionMin: 10, tuitionMax: 5 }).success).toBe(false)
    expect(userDocumentCreateSchema.safeParse({
      documentType: "Passport",
      title: "Passport",
      fileUrl: "https://public.example/passport.pdf",
    }).success).toBe(false)
  })
})
