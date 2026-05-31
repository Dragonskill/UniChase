export function mapUniversityForClient(university) {
  const deadlineStatus = getDeadlineStatus(university)

  return {
    id: university.id,
    name: university.name,
    slug: university.slug,
    koreanName: university.koreanName,
    location: university.city,
    city: university.city,
    country: university.country,
    universityType: university.universityType,
    qsRanking:
      university.qsRanking === null || university.qsRanking === undefined
        ? undefined
        : String(university.qsRanking),
    qsRankingNumber: university.qsRanking,
    qsRankingYear: university.qsRankingYear,
    rankingSourceNote: university.rankingSourceNote,
    officialWebsite: university.officialWebsite,
    image: university.imageUrl,
    imageUrl: university.imageUrl,
    logo: university.logoUrl,
    logoUrl: university.logoUrl,
    description: university.description,
    programs: university.programs,
    tuition: {
      min: university.tuitionMin,
      max: university.tuitionMax,
      currency: university.tuitionCurrency,
    },
    admissionRequirements: university.admissionRequirements,
    languageOfInstruction: university.languagesOfInstruction,
    scholarshipInfo: university.scholarshipInfo,
    hasScholarships: university.hasScholarships,
    hasDormitory: university.hasDormitory,
    dormitoryHousingInfo: university.housingInfo,
    internationalStudentInfo: university.internationalStudentInfo,
    studentLife: university.studentLife,
    requiredDocuments: university.requiredDocuments,
    applicationSteps: university.applicationSteps,
    studyLevels: university.studyLevels,
    applicationDeadlines: university.applicationDeadlines,
    deadlines: {
      applicationOpenDate: formatDate(university.applicationOpenDate),
      applicationDeadline: formatDate(university.applicationDeadline),
      scholarshipDeadline: formatDate(university.scholarshipDeadline),
      documentDeadline: formatDate(university.documentDeadline),
      status: deadlineStatus,
    },
    tags: university.tags,
    contact: {
      email: university.contactEmail,
      phone: university.contactPhone,
      address: university.contactAddress,
    },
    mainColor: university.mainColor,
    acceptanceRate: university.acceptanceRate,
    createdAt: university.createdAt?.toISOString?.() ?? university.createdAt,
    updatedAt: university.updatedAt?.toISOString?.() ?? university.updatedAt,
  }
}

function formatDate(value) {
  return value?.toISOString?.() ?? value ?? null
}

export function getDeadlineStatus(university, now = new Date()) {
  const openDate = university.applicationOpenDate
  const deadline = university.applicationDeadline

  if (!deadline) {
    return "unknown"
  }

  if (deadline < now) {
    return "closed"
  }

  const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

  if (daysUntilDeadline <= 45) {
    return "deadline soon"
  }

  if (!openDate || openDate <= now) {
    return "open now"
  }

  return "upcoming"
}
