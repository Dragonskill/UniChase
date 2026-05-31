import { describe, expect, it } from "vitest"
import { mapUniversityForClient } from "../src/mappers/universityMapper.js"

describe("mapUniversityForClient", () => {
  it("keeps the frontend university card shape while exposing backend fields", () => {
    const mapped = mapUniversityForClient({
      id: 1,
      name: "Seoul National University",
      koreanName: "서울대학교",
      city: "Seoul",
      country: "South Korea",
      qsRanking: 29,
      qsRankingYear: 2026,
      rankingSourceNote: "Seed value",
      officialWebsite: "https://en.snu.ac.kr",
      imageUrl: "https://example.com/snu.jpg",
      logoUrl: "https://example.com/snu.svg",
      description: "A university description",
      programs: ["Engineering"],
      tuitionMin: 2500000,
      tuitionMax: 6200000,
      tuitionCurrency: "KRW",
      admissionRequirements: ["Transcript"],
      languagesOfInstruction: ["Korean", "English"],
      scholarshipInfo: "Scholarships available",
      hasScholarships: true,
      housingInfo: "Dormitory available",
      internationalStudentInfo: "International office available",
      applicationDeadlines: { fall: "Check guide" },
      tags: ["Seoul"],
      contactEmail: "info@example.com",
      contactPhone: "+82-2-0000-0000",
      contactAddress: "Seoul",
      mainColor: "#15397F",
      acceptanceRate: "12%",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    })

    expect(mapped.location).toBe("Seoul")
    expect(mapped.image).toBe("https://example.com/snu.jpg")
    expect(mapped.logo).toBe("https://example.com/snu.svg")
    expect(mapped.qsRanking).toBe("29")
    expect(mapped.tuition).toEqual({
      min: 2500000,
      max: 6200000,
      currency: "KRW",
    })
    expect(mapped.languageOfInstruction).toEqual(["Korean", "English"])
  })
})
