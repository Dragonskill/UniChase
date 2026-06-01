export function mapUniversityForClient(university) {
  const deadlineStatus = getDeadlineStatus(university)
  const image = university.imageUrl || buildPlaceholderImage(university)
  const logo = university.logoUrl || buildPlaceholderLogo(university)

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
      university.qsRankingLabel ||
      (university.qsRanking === null || university.qsRanking === undefined
        ? undefined
        : String(university.qsRanking)),
    qsRankingNumber: university.qsRanking,
    qsRankingLabel: university.qsRankingLabel,
    qsRankingYear: university.qsRankingYear,
    rankingSourceNote: university.rankingSourceNote,
    qsSourceUrl: university.qsSourceUrl,
    sourceUrls: university.sourceUrls || [],
    lastVerifiedAt: formatDate(university.lastVerifiedAt),
    officialWebsite: university.officialWebsite,
    image,
    imageUrl: university.imageUrl,
    logo,
    logoUrl: university.logoUrl,
    description: university.description,
    fullDescription: university.fullDescription,
    programs: university.programs,
    tuition: {
      min: university.tuitionMin,
      max: university.tuitionMax,
      currency: university.tuitionCurrency,
    },
    admissionRequirements: university.admissionRequirements,
    languageOfInstruction: university.languagesOfInstruction,
    scholarshipInfo: university.scholarshipInfo,
    hasScholarships: university.hasScholarships ?? null,
    hasDormitory: university.hasDormitory ?? null,
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
    studentCouncil: university.studentCouncil ? mapStudentCouncilForClient(university.studentCouncil) : undefined,
    createdAt: university.createdAt?.toISOString?.() ?? university.createdAt,
    updatedAt: university.updatedAt?.toISOString?.() ?? university.updatedAt,
  }
}

export function mapStudentCouncilForClient(council) {
  return {
    id: council.id,
    universityId: council.universityId,
    name: council.name,
    officialName: council.officialName,
    description: council.description,
    websiteUrl: council.websiteUrl,
    socialUrl: council.socialUrl,
    contactEmail: council.contactEmail,
    sourceUrl: council.sourceUrl,
    verificationStatus: council.verificationStatus,
    lastVerifiedAt: formatDate(council.lastVerifiedAt),
    roles: (council.roles || []).map(mapStudentCouncilRoleForClient),
    university: council.university
      ? {
          id: council.university.id,
          name: council.university.name,
          slug: council.university.slug,
          city: council.university.city,
        }
      : undefined,
    createdAt: formatDate(council.createdAt),
    updatedAt: formatDate(council.updatedAt),
  }
}

export function mapStudentCouncilRoleForClient(role) {
  return {
    id: role.id,
    councilId: role.councilId,
    universityId: role.universityId,
    adminUserId: role.adminUserId,
    displayName: role.displayName,
    roleTitle: role.roleTitle,
    department: role.department,
    description: role.description,
    responsibilities: role.responsibilities || [],
    contactEmail: role.contactEmail,
    contactUrl: role.contactUrl,
    avatarUrl: role.avatarUrl,
    status: role.status,
    verificationStatus: role.verificationStatus,
    sourceUrl: role.sourceUrl,
    createdAt: formatDate(role.createdAt),
    updatedAt: formatDate(role.updatedAt),
  }
}

function initials(value) {
  return String(value || "UniChase")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

function normalizeHexColor(value) {
  return /^#[0-9a-f]{6}$/i.test(value || "") ? value : "#15397F"
}

function svgDataUri(svg) {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function buildPlaceholderImage(university) {
  const color = normalizeHexColor(university.mainColor)
  const name = escapeSvg(university.name)
  const city = escapeSvg(university.city || "South Korea")

  return svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" role="img" aria-label="${name}">
      <rect width="1200" height="675" fill="#f6f1e8"/>
      <rect width="1200" height="675" fill="${color}" opacity="0.12"/>
      <path d="M0 540 C220 460 380 610 610 505 C835 402 970 510 1200 430 L1200 675 L0 675 Z" fill="${color}" opacity="0.2"/>
      <circle cx="1025" cy="155" r="92" fill="${color}" opacity="0.18"/>
      <text x="80" y="510" fill="${color}" font-family="Inter, Arial, sans-serif" font-size="58" font-weight="700">${name}</text>
      <text x="82" y="574" fill="#59616d" font-family="Inter, Arial, sans-serif" font-size="32">${city}</text>
    </svg>
  `)
}

function buildPlaceholderLogo(university) {
  const color = normalizeHexColor(university.mainColor)
  const label = escapeSvg(initials(university.name))

  return svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" role="img" aria-label="${escapeSvg(university.name)} logo placeholder">
      <rect width="160" height="160" rx="32" fill="#ffffff"/>
      <rect x="8" y="8" width="144" height="144" rx="28" fill="${color}" opacity="0.1"/>
      <circle cx="80" cy="80" r="54" fill="${color}"/>
      <text x="80" y="94" text-anchor="middle" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="38" font-weight="800">${label}</text>
    </svg>
  `)
}

function escapeSvg(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
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
