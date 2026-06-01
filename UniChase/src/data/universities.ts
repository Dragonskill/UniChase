export type StudentCouncilRole = {
  id: number
  councilId: number
  universityId: number
  adminUserId?: number | null
  displayName?: string | null
  roleTitle: string
  department?: string | null
  description?: string | null
  responsibilities?: string[]
  contactEmail?: string | null
  contactUrl?: string | null
  avatarUrl?: string | null
  status: "active" | "inactive" | "pending"
  verificationStatus: "verified" | "manually added" | "needs verification"
  sourceUrl?: string | null
  createdAt?: string
  updatedAt?: string
}

export type StudentCouncil = {
  id: number
  universityId: number
  name: string
  officialName?: string | null
  description: string
  websiteUrl?: string | null
  socialUrl?: string | null
  contactEmail?: string | null
  sourceUrl?: string | null
  verificationStatus: "verified" | "manually added" | "needs verification"
  lastVerifiedAt?: string | null
  roles?: StudentCouncilRole[]
  createdAt?: string
  updatedAt?: string
}

export type University = {
  id: number
  name: string
  slug?: string | null
  koreanName?: string | null
  location: string
  city?: string
  country?: string
  universityType?: "public" | "private"
  image: string
  imageUrl?: string | null
  logo: string
  logoUrl?: string | null
  description: string
  fullDescription?: string | null
  mainColor: string
  acceptanceRate?: string | null
  qsRanking?: string
  qsRankingLabel?: string | null
  qsRankingNumber?: number | null
  qsRankingYear?: number | null
  rankingSourceNote?: string | null
  qsSourceUrl?: string | null
  sourceUrls?: string[]
  lastVerifiedAt?: string | null
  officialWebsite?: string
  programs?: string[]
  tuition?: {
    min?: number | null
    max?: number | null
    currency?: string
  }
  admissionRequirements?: string[]
  languageOfInstruction?: string[]
  scholarshipInfo?: string | null
  hasScholarships?: boolean | null
  hasDormitory?: boolean | null
  dormitoryHousingInfo?: string | null
  internationalStudentInfo?: string | null
  studentLife?: string | null
  requiredDocuments?: string[]
  applicationSteps?: string[]
  studyLevels?: string[]
  applicationDeadlines?: Record<string, unknown> | null
  deadlines?: {
    applicationOpenDate?: string | null
    applicationDeadline?: string | null
    scholarshipDeadline?: string | null
    documentDeadline?: string | null
    status?: string
  }
  tags?: string[]
  contact?: {
    email?: string | null
    phone?: string | null
    address?: string | null
  }
  studentCouncil?: StudentCouncil
  createdAt?: string
  updatedAt?: string
}

export const universities: University[] = []
