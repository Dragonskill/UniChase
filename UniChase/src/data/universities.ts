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

const qsSourceUrl = "https://www.topuniversities.com/qs-top-uni-wur"
const koreaRankingSourceUrl = "https://truescho.com/en/rankings/country/kr"
const lastVerifiedAt = "2026-06-01T00:00:00.000Z"

type StaticUniversitySeed = {
  id: number
  name: string
  koreanName: string
  slug: string
  city: string
  universityType: "public" | "private"
  qsRanking: string
  qsRankingNumber: number
  officialWebsite: string
}

const qsKoreaTopUniversities: StaticUniversitySeed[] = [
  { id: 1, name: "Seoul National University", koreanName: "서울대학교", slug: "seoul-national-university", city: "Seoul", universityType: "public", qsRanking: "#=38", qsRankingNumber: 38, officialWebsite: "https://en.snu.ac.kr" },
  { id: 2, name: "Yonsei University", koreanName: "연세대학교", slug: "yonsei-university", city: "Seoul", universityType: "private", qsRanking: "#50", qsRankingNumber: 50, officialWebsite: "https://www.yonsei.ac.kr/en_sc/" },
  { id: 3, name: "Korea University", koreanName: "고려대학교", slug: "korea-university", city: "Seoul", universityType: "private", qsRanking: "#61", qsRankingNumber: 61, officialWebsite: "https://www.korea.edu/mbshome/mbs/en/index.do" },
  { id: 4, name: "Pohang University of Science And Technology (POSTECH)", koreanName: "포항공과대학교", slug: "pohang-university-of-science-and-technology-postech", city: "Pohang", universityType: "private", qsRanking: "#102", qsRankingNumber: 102, officialWebsite: "https://www.postech.ac.kr/eng/" },
  { id: 5, name: "Sungkyunkwan University (SKKU)", koreanName: "성균관대학교", slug: "sungkyunkwan-university-skku", city: "Seoul", universityType: "private", qsRanking: "#=126", qsRankingNumber: 126, officialWebsite: "https://www.skku.edu/eng/" },
  { id: 6, name: "Hanyang University", koreanName: "한양대학교", slug: "hanyang-university", city: "Seoul", universityType: "private", qsRanking: "#159", qsRankingNumber: 159, officialWebsite: "https://www.hanyang.ac.kr/web/eng" },
  { id: 7, name: "Ulsan National Institute of Science and Technology (UNIST)", koreanName: "울산과학기술원", slug: "ulsan-national-institute-of-science-and-technology-unist", city: "Ulsan", universityType: "public", qsRanking: "#=310", qsRankingNumber: 310, officialWebsite: "https://www.unist.ac.kr" },
  { id: 8, name: "Kyung Hee University", koreanName: "경희대학교", slug: "kyung-hee-university", city: "Seoul", universityType: "private", qsRanking: "#=331", qsRankingNumber: 331, officialWebsite: "https://www.khu.ac.kr/eng/" },
  { id: 9, name: "Daegu Gyeongbuk Institute of Science and Technology (DGIST)", koreanName: "대구경북과학기술원", slug: "daegu-gyeongbuk-institute-of-science-and-technology-dgist", city: "Daegu", universityType: "public", qsRanking: "#370", qsRankingNumber: 370, officialWebsite: "https://www.dgist.ac.kr/en/" },
  { id: 10, name: "Gwangju Institute of Science and Technology (GIST)", koreanName: "광주과학기술원", slug: "gwangju-institute-of-science-and-technology-gist", city: "Gwangju", universityType: "public", qsRanking: "#=385", qsRankingNumber: 385, officialWebsite: "https://www.gist.ac.kr/en/" },
  { id: 11, name: "Sejong University", koreanName: "세종대학교", slug: "sejong-university", city: "Seoul", universityType: "private", qsRanking: "#=392", qsRankingNumber: 392, officialWebsite: "https://eng.sejong.ac.kr/" },
  { id: 12, name: "Pusan National University", koreanName: "부산대학교", slug: "pusan-national-university", city: "Busan", universityType: "public", qsRanking: "#=473", qsRankingNumber: 473, officialWebsite: "https://www.pusan.ac.kr/eng/" },
  { id: 13, name: "Chung-Ang University (CAU)", koreanName: "중앙대학교", slug: "chung-ang-university-cau", city: "Seoul", universityType: "private", qsRanking: "#479", qsRankingNumber: 479, officialWebsite: "https://neweng.cau.ac.kr/" },
  { id: 14, name: "Ewha Womans University", koreanName: "이화여자대학교", slug: "ewha-womans-university", city: "Seoul", universityType: "private", qsRanking: "#=504", qsRankingNumber: 504, officialWebsite: "https://www.ewha.ac.kr/ewhaen/" },
  { id: 15, name: "Kyungpook National University", koreanName: "경북대학교", slug: "kyungpook-national-university", city: "Daegu", universityType: "public", qsRanking: "#=519", qsRankingNumber: 519, officialWebsite: "https://en.knu.ac.kr/" },
  { id: 16, name: "Sogang University", koreanName: "서강대학교", slug: "sogang-university", city: "Seoul", universityType: "private", qsRanking: "#=558", qsRankingNumber: 558, officialWebsite: "https://wwwe.sogang.ac.kr/wwwe/index_new.html" },
  { id: 17, name: "Ajou University", koreanName: "아주대학교", slug: "ajou-university", city: "Suwon", universityType: "private", qsRanking: "#=563", qsRankingNumber: 563, officialWebsite: "https://www.ajou.ac.kr/en/" },
  { id: 18, name: "Dongguk University", koreanName: "동국대학교", slug: "dongguk-university", city: "Seoul", universityType: "private", qsRanking: "#=618", qsRankingNumber: 618, officialWebsite: "https://www.dongguk.edu/eng/" },
  { id: 19, name: "Inha University", koreanName: "인하대학교", slug: "inha-university", city: "Incheon", universityType: "private", qsRanking: "#=643", qsRankingNumber: 643, officialWebsite: "https://www.inha.ac.kr/eng/" },
  { id: 20, name: "Konkuk University", koreanName: "건국대학교", slug: "konkuk-university", city: "Seoul", universityType: "private", qsRanking: "#=654", qsRankingNumber: 654, officialWebsite: "https://www.konkuk.ac.kr/eng/" },
  { id: 21, name: "HUFS - Hankuk (Korea) University of Foreign Studies", koreanName: "한국외국어대학교", slug: "hufs-hankuk-korea-university-of-foreign-studies", city: "Seoul", universityType: "private", qsRanking: "#=680", qsRankingNumber: 680, officialWebsite: "https://www.hufs.ac.kr/eng/" },
  { id: 22, name: "Jeonbuk National University", koreanName: "전북대학교", slug: "jeonbuk-national-university", city: "Jeonju", universityType: "public", qsRanking: "#701-710", qsRankingNumber: 701, officialWebsite: "https://www.jbnu.ac.kr/eng/" },
  { id: 23, name: "The Catholic University of Korea (CUK)", koreanName: "가톨릭대학교", slug: "the-catholic-university-of-korea-cuk", city: "Bucheon", universityType: "private", qsRanking: "#741-750", qsRankingNumber: 741, officialWebsite: "https://www.catholic.ac.kr/english/" },
  { id: 24, name: "University of Ulsan", koreanName: "울산대학교", slug: "university-of-ulsan", city: "Ulsan", universityType: "private", qsRanking: "#801-850", qsRankingNumber: 801, officialWebsite: "https://en.ulsan.ac.kr/" },
  { id: 25, name: "Chungnam National University", koreanName: "충남대학교", slug: "chungnam-national-university", city: "Daejeon", universityType: "public", qsRanking: "#851-900", qsRankingNumber: 851, officialWebsite: "https://plus.cnu.ac.kr/html/en/" },
  { id: 26, name: "University of Seoul", koreanName: "서울시립대학교", slug: "university-of-seoul", city: "Seoul", universityType: "public", qsRanking: "#851-900", qsRankingNumber: 851, officialWebsite: "https://english.uos.ac.kr/" },
  { id: 27, name: "Chonnam National University", koreanName: "전남대학교", slug: "chonnam-national-university", city: "Gwangju", universityType: "public", qsRanking: "#901-950", qsRankingNumber: 901, officialWebsite: "https://international.jnu.ac.kr/" },
  { id: 28, name: "Yeungnam University", koreanName: "영남대학교", slug: "yeungnam-university", city: "Gyeongsan", universityType: "private", qsRanking: "#901-950", qsRankingNumber: 901, officialWebsite: "https://www.yu.ac.kr/english/" },
]

const colors = ["#0f3d75", "#0b5d69", "#8a1538", "#124734", "#b45309", "#4338ca", "#0f766e", "#7c2d12"]

const councilRoleTemplates = [
  {
    title: "President",
    responsibilities: ["Represent the student body", "Coordinate student council priorities"],
  },
  {
    title: "Vice President",
    responsibilities: ["Support council operations", "Coordinate cross-team follow-up"],
  },
  {
    title: "International Student Representative",
    responsibilities: ["Represent international student concerns", "Help route support and orientation feedback"],
  },
  {
    title: "Academic Affairs Representative",
    responsibilities: ["Gather academic feedback", "Coordinate academic policy communication"],
  },
  {
    title: "Welfare Representative",
    responsibilities: ["Monitor student welfare topics", "Support campus life issue escalation"],
  },
]

function svgDataUri(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function placeholderImage(name: string, city: string, color: string) {
  return svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 650">
      <rect width="1200" height="650" fill="#f7f5ef"/>
      <rect y="430" width="1200" height="220" fill="#d8e3dc"/>
      <rect x="170" y="210" width="860" height="270" rx="18" fill="${color}"/>
      <rect x="235" y="260" width="120" height="170" fill="#ffffff" opacity=".22"/>
      <rect x="400" y="260" width="120" height="170" fill="#ffffff" opacity=".22"/>
      <rect x="565" y="260" width="120" height="170" fill="#ffffff" opacity=".22"/>
      <rect x="730" y="260" width="120" height="170" fill="#ffffff" opacity=".22"/>
      <rect x="515" y="340" width="170" height="140" fill="#f7f5ef" opacity=".9"/>
      <circle cx="245" cy="500" r="58" fill="#85b79d"/>
      <circle cx="930" cy="500" r="70" fill="#6a994e"/>
      <text x="600" y="110" text-anchor="middle" font-family="Inter, Arial" font-size="54" font-weight="700" fill="${color}">${name}</text>
      <text x="600" y="170" text-anchor="middle" font-family="Inter, Arial" font-size="30" fill="#5f6b7a">${city}, South Korea</text>
    </svg>
  `)
}

function placeholderLogo(name: string, color: string) {
  const initials = name
    .replace(/\([^)]*\)/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

  return svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
      <circle cx="80" cy="80" r="74" fill="#ffffff" stroke="${color}" stroke-width="10"/>
      <text x="80" y="94" text-anchor="middle" font-family="Inter, Arial" font-size="42" font-weight="700" fill="${color}">${initials}</text>
    </svg>
  `)
}

function makeCouncil(university: StaticUniversitySeed): StudentCouncil {
  return {
    id: university.id,
    universityId: university.id,
    name: `${university.name} Student Council`,
    officialName: null,
    description: "Student council structure placeholder. Real members are not listed until verified from official public sources or added by a moderator.",
    websiteUrl: null,
    socialUrl: null,
    contactEmail: null,
    sourceUrl: null,
    verificationStatus: "needs verification",
    lastVerifiedAt,
    roles: councilRoleTemplates.map((role, index) => ({
      id: university.id * 100 + index + 1,
      councilId: university.id,
      universityId: university.id,
      adminUserId: null,
      displayName: null,
      roleTitle: role.title,
      department: null,
      description: "Role placeholder only. No real student name has been verified.",
      responsibilities: role.responsibilities,
      contactEmail: null,
      contactUrl: null,
      avatarUrl: null,
      status: "pending",
      verificationStatus: "needs verification",
      sourceUrl: null,
      createdAt: lastVerifiedAt,
      updatedAt: lastVerifiedAt,
    })),
    createdAt: lastVerifiedAt,
    updatedAt: lastVerifiedAt,
  }
}

export const universities: University[] = qsKoreaTopUniversities.map((university, index) => {
  const color = colors[index % colors.length]

  return {
    id: university.id,
    name: university.name,
    slug: university.slug,
    koreanName: university.koreanName,
    location: university.city,
    city: university.city,
    country: "South Korea",
    universityType: university.universityType,
    image: placeholderImage(university.name, university.city, color),
    imageUrl: null,
    logo: placeholderLogo(university.name, color),
    logoUrl: null,
    description: `${university.name} is a South Korean university listed in the QS World University Rankings 2026.`,
    fullDescription: `${university.name} (${university.koreanName}) is included in the QS World University Rankings 2026 top 1000 for South Korea. Detailed admissions, tuition, housing, and student support data should be verified against official university sources before publication.`,
    mainColor: color,
    acceptanceRate: null,
    qsRanking: university.qsRanking,
    qsRankingLabel: university.qsRanking,
    qsRankingNumber: university.qsRankingNumber,
    qsRankingYear: 2026,
    rankingSourceNote: "QS World University Rankings 2026. Ranged rankings use the first number for sorting.",
    qsSourceUrl,
    sourceUrls: [qsSourceUrl, koreaRankingSourceUrl, university.officialWebsite],
    lastVerifiedAt,
    officialWebsite: university.officialWebsite,
    programs: ["Undergraduate programs", "Graduate programs", "International admissions", "Korean language support"],
    tuition: { min: null, max: null, currency: "KRW" },
    admissionRequirements: ["Application form", "Academic transcripts", "Proof of language ability where required", "Passport or identification documents"],
    languageOfInstruction: ["Korean", "English"],
    scholarshipInfo: "Scholarship information should be verified with the university's official admissions or international office.",
    hasScholarships: null,
    hasDormitory: null,
    dormitoryHousingInfo: "Dormitory availability should be confirmed with the university housing office.",
    internationalStudentInfo: "International student services and admissions requirements should be verified with the official university site.",
    studentLife: "Campus life details will be updated as verified public information becomes available.",
    requiredDocuments: ["Application form", "Transcripts", "Graduation certificate or expected graduation proof", "Language score if required", "Passport copy"],
    applicationSteps: ["Review the official admissions guide", "Prepare required documents", "Submit the online application", "Track university announcements"],
    studyLevels: ["Undergraduate", "Graduate"],
    applicationDeadlines: null,
    deadlines: {
      applicationOpenDate: null,
      applicationDeadline: null,
      scholarshipDeadline: null,
      documentDeadline: null,
      status: "Check official admissions calendar",
    },
    tags: ["QS 2026", "South Korea", university.city, university.universityType],
    contact: {
      email: null,
      phone: null,
      address: `${university.city}, South Korea`,
    },
    studentCouncil: makeCouncil(university),
    createdAt: lastVerifiedAt,
    updatedAt: lastVerifiedAt,
  }
})
