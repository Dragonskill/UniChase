import { getToken } from "@/lib/storage"
import { universities, type University } from "@/data/universities"
import programDataset from "../../data/programs.json"
import type {
  ApplicationRoadmap,
  CostEstimate,
  DocumentChecklist,
  EligibilityResult,
  EssayFeedback,
  EssayDraft,
  ReminderPreference,
  Program,
  RoadmapStep,
  UniversityReview,
} from "@/lib/api"

const keys = {
  roadmaps: "unichase:student-tools:roadmaps",
  documents: "unichase:student-tools:documents",
  essays: "unichase:student-tools:essays",
  visa: "unichase:student-tools:visa",
  costs: "unichase:student-tools:costs",
  eligibility: "unichase:student-tools:eligibility",
  reviews: "unichase:student-tools:reviews",
  reminders: "unichase:student-tools:reminders",
}

function readList<T>(key: string, fallback: T[] = []) {
  if (getToken()) return fallback
  try {
    const raw = sessionStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : null
    return Array.isArray(parsed) ? parsed as T[] : fallback
  } catch {
    return fallback
  }
}

function writeList<T>(key: string, value: T[]) {
  if (getToken()) throw new Error("Sign in to save this to your account. Your changes were not saved.")
  sessionStorage.setItem(key, JSON.stringify(value))
}

function nextId(items: { id?: number }[]) {
  return Math.max(0, ...items.map((item) => item.id || 0)) + 1
}

function futureDate(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length
}

export function buildLocalPrograms(source: University[] = universities): Program[] {
  return programDataset.programs.flatMap((verified, index) => {
    const university = source.find(item => item.slug === verified.universitySlug)
    if (!university) return []
    return [{
      id: index + 1, universityId: university.id, slug: verified.slug, name: verified.name,
      degreeLevel: verified.degreeLevel, languageOfInstruction: "Not verified — check the official program page",
      tuition: { min: null, max: null, currency: "KRW" }, duration: null,
      requirements: [], requiredDocuments: [], applicationPeriod: null, careerOutcomes: [],
      officialLink: verified.officialLink, university,
    }]
  })
}

export function getLocalRoadmaps() {
  return readList<ApplicationRoadmap>(keys.roadmaps)
}

export function saveLocalRoadmaps(items: ApplicationRoadmap[]) {
  writeList(keys.roadmaps, items)
}

export function createLocalRoadmap(input: Omit<ApplicationRoadmap, "id" | "progress" | "steps" | "university">) {
  const items = getLocalRoadmaps()
  const roadmap: ApplicationRoadmap = {
    ...input,
    id: nextId(items),
    progress: 0,
    steps: [
      "Confirm eligibility and shortlist programs",
      "Collect academic and identity documents",
      "Draft statement of purpose or study plan",
      "Submit application and confirm payment",
      "Prepare visa and arrival plan",
    ].map((title, index) => ({
      id: index + 1,
      title,
      description: index === 0 ? `Start with ${input.targetMajor} requirements.` : "Keep this step updated as your plan changes.",
      completed: false,
      dueDate: futureDate([7, 21, 35, 60, 90][index]),
      sortOrder: index + 1,
    })),
  }
  const next = [roadmap, ...items]
  saveLocalRoadmaps(next)
  return roadmap
}

export function updateLocalRoadmapStep(roadmapId: number, stepId: number, completed: boolean) {
  const roadmaps = getLocalRoadmaps()
  const next = roadmaps.map((roadmap) => {
    if (roadmap.id !== roadmapId) {
      return roadmap
    }

    const steps = roadmap.steps.map((step) => (step.id === stepId ? { ...step, completed } : step))
    const done = steps.filter((step) => step.completed).length
    return { ...roadmap, steps, progress: steps.length ? Math.round((done / steps.length) * 100) : 0 }
  })
  saveLocalRoadmaps(next)
  return next.find((roadmap) => roadmap.id === roadmapId)
}

export function getLocalDocumentChecklists() {
  return readList<DocumentChecklist>(keys.documents)
}

export function createLocalDocumentChecklist(input: Omit<DocumentChecklist, "id" | "progress" | "items" | "university">) {
  const items = getLocalDocumentChecklists()
  const baseItems = [
    "Application form",
    "Passport copy",
    "Academic transcripts",
    "Graduation certificate",
    "Personal statement or study plan",
    "Financial proof",
    input.languageTrack.toLowerCase().includes("english") ? "English proficiency proof" : "TOPIK or Korean language proof",
  ]
  const university = universities.find(item => item.id === input.universityId)
  if (university?.requiredDocuments) baseItems.push(...university.requiredDocuments)
  if (/^(graduate|master|masters|phd|doctor|doctoral)$/i.test(input.degreeLevel)) baseItems.push("Recommendation letters", "Research plan or portfolio if required")
  const checklist: DocumentChecklist = {
    ...input,
    id: nextId(items),
    progress: 0,
    items: [...new Set(baseItems)].map((title, index) => ({
      id: index + 1,
      title,
      description: "Confirm exact format with the university admission guide.",
      completed: false,
      optional: false,
      sortOrder: index + 1,
    })),
  }
  const next = [checklist, ...items]
  writeList(keys.documents, next)
  return checklist
}

export function updateLocalDocumentItem(checklistId: number, itemId: number, completed: boolean) {
  const checklists = getLocalDocumentChecklists()
  const next = checklists.map((checklist) => {
    if (checklist.id !== checklistId) {
      return checklist
    }

    const items = checklist.items.map((item) => (item.id === itemId ? { ...item, completed } : item))
    const done = items.filter((item) => item.completed).length
    return { ...checklist, items, progress: items.length ? Math.round((done / items.length) * 100) : 0 }
  })
  writeList(keys.documents, next)
  return next.find((checklist) => checklist.id === checklistId)
}

export function buildEssayFeedback(content: string, targetMajor?: string | null): EssayFeedback {
  const wordCount = countWords(content)
  const suggestions = []

  if (wordCount < 250) {
    suggestions.push("Add more academic examples, projects, or achievements.")
  }

  if (!/korea|korean|south korea/i.test(content)) {
    suggestions.push("Explain why South Korea fits your study plan.")
  }

  if (!/goal|career|future|plan/i.test(content)) {
    suggestions.push("Connect the essay to a clear career or study goal.")
  }

  if (targetMajor && !content.toLowerCase().includes(targetMajor.toLowerCase())) {
    suggestions.push(`Mention ${targetMajor} directly and explain your fit.`)
  }

  if (suggestions.length === 0) {
    suggestions.push("Strong foundation. Polish transitions and add program-specific details.")
  }

  return {
    wordCount,
    characterCount: content.length,
    tone: wordCount > 700 ? "Detailed" : "Concise",
    suggestions,
    structure: ["Opening motivation", "Academic preparation", "Program fit", "Career plan", "Closing commitment"],
  }
}

export function getLocalVisaItems() {
  const fallback: RoadmapStep[] = [
    "Certificate of admission",
    "Passport and passport photo",
    "Visa application form",
    "Financial proof",
    "Final transcript or graduation certificate",
    "Tuberculosis test if required",
    "Housing address in Korea",
    "Flight and arrival plan",
  ].map((title, index) => ({
    id: index + 1,
    title,
    description: "Confirm exact requirements with the Korean embassy or consulate.",
    completed: false,
    sortOrder: index + 1,
  }))

  return readList<RoadmapStep>(keys.visa, fallback)
}

export function saveLocalVisaItems(items: RoadmapStep[]) {
  writeList(keys.visa, items)
}

export function calculateLocalCost(input: Record<string, number | string | null>): CostEstimate {
  const numberValue = (key: string) => {
    const value = Number(input[key] || 0)
    return Number.isFinite(value) ? Math.min(100000000, Math.max(0, value)) : 0
  }
  const monthlyCost =
    numberValue("housingMonthly") +
    numberValue("rentMonthly") +
    numberValue("foodMonthly") +
    numberValue("transportMonthly") +
    numberValue("personalMonthly") +
    numberValue("insuranceMonthly") +
    numberValue("internetMobileMonthly")
  const semestersPerYear = Math.min(4, Math.max(1, Math.floor(numberValue("semestersPerYear") || 2)))
  const monthsPerSemester = Math.min(8, numberValue("monthsPerSemester") || 4.5)
  const tuition = numberValue("tuitionPerSemester")
  const scholarshipAmount = numberValue("scholarshipAmount")
  const booksPerYear = numberValue("booksPerYear")
  const yearlyCost = Math.max(0, tuition * semestersPerYear + monthlyCost * 12 + booksPerYear - scholarshipAmount)

  return {
    name: String(input.name || "Study cost estimate"),
    universityId: Number(input.universityId) || null,
    inputs: input,
    monthlyCost,
    semesterCost: Math.round(tuition + monthlyCost * monthsPerSemester + booksPerYear / semestersPerYear),
    yearlyCost,
    firstYearCost: yearlyCost + numberValue("applicationFees") + numberValue("visaCosts") + numberValue("flightCost") + numberValue("emergencyBudget"),
    breakdown: {
      tuition: tuition * semestersPerYear,
      dormitory: numberValue("housingMonthly") * 12,
      rent: numberValue("rentMonthly") * 12,
      food: numberValue("foodMonthly") * 12,
      transport: numberValue("transportMonthly") * 12,
      personal: numberValue("personalMonthly") * 12,
      insurance: numberValue("insuranceMonthly") * 12,
      internetMobile: numberValue("internetMobileMonthly") * 12,
      books: booksPerYear,
      applicationFees: numberValue("applicationFees"),
      visaCosts: numberValue("visaCosts"),
      flightCost: numberValue("flightCost"),
      emergencyBudget: numberValue("emergencyBudget"),
      scholarshipAmount,
    },
  }
}

export function saveLocalCostEstimate(estimate: CostEstimate) {
  const estimates = readList<CostEstimate>(keys.costs)
  const saved = { ...estimate, id: nextId(estimates) }
  writeList(keys.costs, [saved, ...estimates])
  return saved
}

export function evaluateLocalEligibility(input: Record<string, unknown>): EligibilityResult {
  const missingRequirements: string[] = []
  const gpa = input.gpa === "" || input.gpa == null ? null : Number(input.gpa)
  const budget = input.budget === "" || input.budget == null ? null : Number(input.budget)
  const checks: [boolean, string][] = [
    [gpa !== null && Number.isFinite(gpa) && gpa >= 3.2, "GPA benchmark of 3.2/4.5; verify the program's scale and threshold"],
    [Boolean(String(input.englishScore || "").trim() || String(input.koreanScore || "").trim()), "Language test details to verify against the official program requirements"],
    [Boolean(input.hasTranscript), "Academic transcript"],
    [Boolean(input.hasPassport), "Valid passport"],
    [Boolean(input.hasStudyPlan), "Personal statement or study plan"],
    [budget !== null && Number.isFinite(budget) && budget > 0, "A documented study budget or scholarship plan"],
  ]
  if (/^(graduate|master|masters|phd|doctor|doctoral)$/i.test(String(input.degreeLevel || ""))) checks.push([Boolean(input.hasRecommendation), "Recommendation letters if required for this graduate program"])
  for (const [ready, requirement] of checks) if (!ready) missingRequirements.push(requirement)
  const score = Math.round(((checks.length - missingRequirements.length) / checks.length) * 100)
  return {
    targetProgram: String(input.targetProgram || "Target program"),
    degreeLevel: String(input.degreeLevel || "undergraduate"),
    gpa, budget, rawInput: input,
    score,
    status: missingRequirements.length === 0 ? "ready-to-verify" : score >= 60 ? "almost-ready" : "needs-preparation",
    missingRequirements,
    nextSteps: ["Verify academic, language, funding, and nationality requirements in the official admission guide.", "This measures preparation only; it does not determine admission eligibility."],
  }
}

export function getLocalReviews(universityId: number) {
  return readList<UniversityReview>(keys.reviews).filter((review) => review.universityId === universityId)
}

export function saveLocalReview(review: UniversityReview) {
  const reviews = readList<UniversityReview>(keys.reviews)
  const saved = { ...review, id: nextId(reviews), createdAt: new Date().toISOString(), status: "draft" }
  writeList(keys.reviews, [saved, ...reviews])
  return saved
}

export function getLocalReminderPreference(): ReminderPreference | null {
  if (getToken()) return null
  try {
    const raw = sessionStorage.getItem(keys.reminders)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveLocalReminderPreference(value: unknown) {
  if (getToken()) throw new Error("Account settings must be saved to the server")
  sessionStorage.setItem(keys.reminders, JSON.stringify(value))
}

export function getLocalEssayDrafts() { return readList<EssayDraft>(keys.essays) }
export function saveLocalEssayDraft(draft: EssayDraft) {
  const drafts = getLocalEssayDrafts()
  const saved = { ...draft, id: draft.id ?? nextId(drafts), feedback: buildEssayFeedback(draft.content, draft.targetMajor), wordCount: countWords(draft.content), characterCount: draft.content.length }
  writeList(keys.essays, [saved, ...drafts.filter(item => item.id !== saved.id)])
  return saved
}
export function deleteLocalEssayDraft(id: number) { writeList(keys.essays, getLocalEssayDrafts().filter(item => item.id !== id)) }
export function getLocalCostEstimates() { return readList<CostEstimate>(keys.costs) }
export function deleteLocalCostEstimate(id: number) { writeList(keys.costs, getLocalCostEstimates().filter(item => item.id !== id)) }
export function getLocalEligibilityResults() { return readList<EligibilityResult>(keys.eligibility) }
export function saveLocalEligibilityResult(result: EligibilityResult) {
  const results = getLocalEligibilityResults()
  const saved = { ...result, id: nextId(results) }
  writeList(keys.eligibility, [saved, ...results])
  return saved
}
