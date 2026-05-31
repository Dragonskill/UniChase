import { universities, type University } from "@/data/universities"
import type {
  ApplicationRoadmap,
  CostEstimate,
  DocumentChecklist,
  EligibilityResult,
  EssayFeedback,
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
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : fallback
  } catch {
    return fallback
  }
}

function writeList<T>(key: string, value: T[]) {
  localStorage.setItem(key, JSON.stringify(value))
}

function nextId(items: { id?: number }[]) {
  return Math.max(0, ...items.map((item) => item.id || 0)) + 1
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
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
  return source.flatMap((university) =>
    (university.programs || ["Global Studies"]).map((programName, index) => ({
      id: university.id * 100 + index,
      universityId: university.id,
      slug: slugify(`${university.name}-${programName}`),
      name: programName,
      degreeLevel: (university.studyLevels || ["undergraduate", "graduate"]).join(" / "),
      languageOfInstruction: (university.languageOfInstruction || ["Korean", "English"]).join(" / "),
      tuition: university.tuition,
      duration: "4 years for undergraduate, 2+ years for graduate programs",
      requirements: university.admissionRequirements || ["Check the official admission guide"],
      requiredDocuments: university.requiredDocuments || ["Passport copy", "Academic transcripts", "Study plan"],
      applicationPeriod: "Check the official admission guide for the current cycle",
      careerOutcomes: ["Graduate study", "Industry roles", "Research or internship opportunities"],
      officialLink: university.officialWebsite,
      university,
    })),
  )
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
  const checklist: DocumentChecklist = {
    ...input,
    id: nextId(items),
    progress: 0,
    items: baseItems.map((title, index) => ({
      id: index + 1,
      title,
      description: "Confirm exact format with the university admission guide.",
      completed: false,
      optional: index > 5,
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
  const numberValue = (key: string) => Number(input[key] || 0)
  const monthlyCost =
    numberValue("housingMonthly") +
    numberValue("foodMonthly") +
    numberValue("transportMonthly") +
    numberValue("personalMonthly") +
    numberValue("insuranceMonthly")
  const semestersPerYear = numberValue("semestersPerYear") || 2
  const monthsPerSemester = numberValue("monthsPerSemester") || 4.5
  const tuition = numberValue("tuitionPerSemester")
  const scholarshipAmount = numberValue("scholarshipAmount")
  const yearlyCost = Math.max(0, tuition * semestersPerYear + monthlyCost * 12 - scholarshipAmount)

  return {
    name: String(input.name || "Study cost estimate"),
    universityId: Number(input.universityId) || null,
    inputs: input,
    monthlyCost,
    semesterCost: Math.round(tuition + monthlyCost * monthsPerSemester),
    yearlyCost,
    firstYearCost: yearlyCost + numberValue("applicationFees") + numberValue("flightCost"),
    breakdown: {
      tuition: tuition * semestersPerYear,
      housing: numberValue("housingMonthly") * 12,
      food: numberValue("foodMonthly") * 12,
      transport: numberValue("transportMonthly") * 12,
      personal: numberValue("personalMonthly") * 12,
      insurance: numberValue("insuranceMonthly") * 12,
      applicationFees: numberValue("applicationFees"),
      flightCost: numberValue("flightCost"),
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
  let score = 20
  const missingRequirements: string[] = []
  const nextSteps: string[] = []
  const gpa = Number(input.gpa || 0)
  const budget = Number(input.budget || 0)

  if (gpa >= 3.2) score += 20
  else missingRequirements.push("Competitive GPA or stronger academic explanation")

  if (input.englishScore || input.koreanScore) score += 20
  else missingRequirements.push("Language proficiency proof")

  if (input.hasTranscript) score += 10
  else missingRequirements.push("Academic transcript")

  if (input.hasPassport) score += 10
  else missingRequirements.push("Valid passport")

  if (input.hasStudyPlan) score += 10
  else missingRequirements.push("Personal statement or study plan")

  if (!budget || budget >= 8000000) score += 10
  else missingRequirements.push("Budget or scholarship plan")

  if (missingRequirements.length) {
    nextSteps.push("Create a document checklist and finish missing items.")
    nextSteps.push("Confirm exact requirements on the official university page.")
  } else {
    nextSteps.push("Start your roadmap and prepare submission dates.")
  }

  return {
    targetProgram: String(input.targetProgram || "Target program"),
    degreeLevel: String(input.degreeLevel || "undergraduate"),
    educationLevel: String(input.educationLevel || ""),
    gpa,
    englishScore: String(input.englishScore || ""),
    koreanScore: String(input.koreanScore || ""),
    budget,
    nationality: String(input.nationality || ""),
    preferredLanguage: String(input.preferredLanguage || ""),
    status: score >= 80 ? "eligible" : score >= 55 ? "almost-ready" : "needs-preparation",
    score,
    missingRequirements,
    nextSteps,
    rawInput: input,
  }
}

export function getLocalReviews(universityId: number) {
  return readList<UniversityReview>(keys.reviews).filter((review) => review.universityId === universityId)
}

export function saveLocalReview(review: UniversityReview) {
  const reviews = readList<UniversityReview>(keys.reviews)
  const saved = { ...review, id: nextId(reviews), createdAt: new Date().toISOString(), status: "approved" }
  writeList(keys.reviews, [saved, ...reviews])
  return saved
}

export function getLocalReminderPreference() {
  try {
    const raw = localStorage.getItem(keys.reminders)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveLocalReminderPreference(value: unknown) {
  localStorage.setItem(keys.reminders, JSON.stringify(value))
}
