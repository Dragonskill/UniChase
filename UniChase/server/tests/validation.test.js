import { describe, expect, it } from "vitest"
import { parseUniversityQuery, universityCreateSchema } from "../src/validation.js"

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
    expect(parsed.hasScholarships).toBe(false)
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
})
