import bcrypt from "bcryptjs"
import dotenv from "dotenv"
import { PrismaClient } from "@prisma/client"

dotenv.config({ quiet: true })

const prisma = new PrismaClient()

const rankingSourceNote =
  "Development seed value for backend testing. Verify against the current QS source before production use."

const defaultRequiredDocuments = [
  "Application form",
  "Academic transcripts",
  "Passport copy",
  "Language proficiency document where required",
  "Personal statement or study plan",
]

const defaultApplicationSteps = [
  "Review program and eligibility requirements",
  "Prepare documents and language records",
  "Submit the online application",
  "Track document screening or interview notices",
  "Confirm admission and visa steps",
]

const studentLifeNote =
  "Students can access clubs, campus events, academic advising, language support, and international student services."

const deadlineTemplates = [
  {
    applicationOpenDate: "2026-03-01T00:00:00.000Z",
    applicationDeadline: "2026-09-15T00:00:00.000Z",
    scholarshipDeadline: "2026-08-15T00:00:00.000Z",
    documentDeadline: "2026-09-22T00:00:00.000Z",
  },
  {
    applicationOpenDate: "2026-03-01T00:00:00.000Z",
    applicationDeadline: "2026-06-25T00:00:00.000Z",
    scholarshipDeadline: "2026-06-10T00:00:00.000Z",
    documentDeadline: "2026-06-30T00:00:00.000Z",
  },
  {
    applicationOpenDate: "2026-02-01T00:00:00.000Z",
    applicationDeadline: "2026-05-15T00:00:00.000Z",
    scholarshipDeadline: "2026-05-01T00:00:00.000Z",
    documentDeadline: "2026-05-22T00:00:00.000Z",
  },
  {
    applicationOpenDate: "2026-04-01T00:00:00.000Z",
    applicationDeadline: "2026-11-20T00:00:00.000Z",
    scholarshipDeadline: "2026-10-25T00:00:00.000Z",
    documentDeadline: "2026-11-30T00:00:00.000Z",
  },
]

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function enrichUniversity(university, index) {
  const deadlines = deadlineTemplates[index % deadlineTemplates.length]
  const type = ["Seoul National University", "KAIST"].includes(university.name)
    ? "public"
    : "private"

  return {
    ...university,
    slug: slugify(university.name),
    universityType: type,
    hasDormitory: true,
    studentLife: studentLifeNote,
    requiredDocuments: defaultRequiredDocuments,
    applicationSteps: defaultApplicationSteps,
    studyLevels: ["undergraduate", "graduate"],
    applicationOpenDate: new Date(deadlines.applicationOpenDate),
    applicationDeadline: new Date(deadlines.applicationDeadline),
    scholarshipDeadline: new Date(deadlines.scholarshipDeadline),
    documentDeadline: new Date(deadlines.documentDeadline),
    applicationDeadlines: {
      ...university.applicationDeadlines,
      applicationOpenDate: deadlines.applicationOpenDate,
      applicationDeadline: deadlines.applicationDeadline,
      scholarshipDeadline: deadlines.scholarshipDeadline,
      documentDeadline: deadlines.documentDeadline,
    },
  }
}

function buildProgramsForUniversity(university) {
  return university.programs.map((programName) => ({
    slug: slugify(`${university.name}-${programName}`),
    name: programName,
    degreeLevel: university.studyLevels?.join(" / ") || "undergraduate / graduate",
    languageOfInstruction: university.languagesOfInstruction?.join(" / ") || "Korean / English",
    tuitionMin: university.tuitionMin,
    tuitionMax: university.tuitionMax,
    tuitionCurrency: university.tuitionCurrency,
    duration: "4 years for undergraduate, 2+ years for graduate programs",
    requirements: university.admissionRequirements,
    requiredDocuments: university.requiredDocuments,
    applicationPeriod:
      university.applicationDeadlines?.fall ||
      university.applicationDeadlines?.spring ||
      "Check the official admission guide for the current cycle",
    careerOutcomes: [
      "Graduate study",
      "Industry roles connected to the major",
      "Research or internship opportunities",
    ],
    officialLink: university.officialWebsite,
  }))
}

const universities = [
  {
    name: "Seoul National University",
    koreanName: "서울대학교",
    city: "Seoul",
    country: "South Korea",
    qsRanking: 29,
    qsRankingYear: 2026,
    rankingSourceNote,
    officialWebsite: "https://en.snu.ac.kr",
    imageUrl:
      "https://en.snu.ac.kr/webdata/eng/gallery/thumb/fb9z62dzd5fz1dbz925z112zdf6z1b3zf30z304zfd.jpg",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/en/7/77/Seoul_national_university_emblem.svg",
    description:
      "SNU, founded in 1946, is one of the most prestigious universities in Korea.",
    programs: ["Engineering", "Business", "Medicine", "Humanities", "Natural Sciences"],
    tuitionMin: 2500000,
    tuitionMax: 6200000,
    tuitionCurrency: "KRW",
    admissionRequirements: [
      "Completed online application",
      "Academic transcripts",
      "Language proficiency documentation",
      "Statement of purpose",
    ],
    languagesOfInstruction: ["Korean", "English"],
    scholarshipInfo:
      "Merit and need-based scholarships are available for selected international students.",
    hasScholarships: true,
    housingInfo:
      "On-campus residence halls are available, with priority policies that may vary by program.",
    internationalStudentInfo:
      "International student services support admissions, visas, orientation, and campus life.",
    applicationDeadlines: {
      spring: "Usually announced in the previous July or August",
      fall: "Usually announced in the previous February or March",
    },
    tags: ["SKY", "Research", "Public", "Seoul"],
    contactEmail: "intladm@snu.ac.kr",
    contactPhone: "+82-2-880-6971",
    contactAddress: "1 Gwanak-ro, Gwanak-gu, Seoul",
    mainColor: "#15397F",
    acceptanceRate: "12%",
  },
  {
    name: "Korea University",
    koreanName: "고려대학교",
    city: "Seoul",
    country: "South Korea",
    qsRanking: 66,
    qsRankingYear: 2026,
    rankingSourceNote,
    officialWebsite: "https://www.korea.edu",
    imageUrl:
      "https://uploaded.kcampus.kr/1_5f0ebd83_623d_4f9c_9556_52c82dbd5a15_0de2b3e5f9.jpg",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/en/thumb/f/f6/Korea_University_Global_Symbol.svg/960px-Korea_University_Global_Symbol.svg.png",
    description:
      "Korea University (KU) is one of South Korea's oldest and most prestigious universities.",
    programs: ["Business", "Law", "Engineering", "Korean Studies", "Media"],
    tuitionMin: 3600000,
    tuitionMax: 7200000,
    tuitionCurrency: "KRW",
    admissionRequirements: [
      "Application form",
      "Academic records",
      "Passport copy",
      "Language score or interview, depending on program",
    ],
    languagesOfInstruction: ["Korean", "English"],
    scholarshipInfo:
      "International admission scholarships and continuing student scholarships are offered competitively.",
    hasScholarships: true,
    housingInfo:
      "University dormitory options are available near the Seoul campus for eligible students.",
    internationalStudentInfo:
      "The international office provides academic and student life support for degree-seeking students.",
    applicationDeadlines: {
      spring: "Check the annual international admission guide",
      fall: "Check the annual international admission guide",
    },
    tags: ["SKY", "Private", "Seoul", "Business"],
    contactEmail: "graduate1@korea.ac.kr",
    contactPhone: "+82-2-3290-5156",
    contactAddress: "145 Anam-ro, Seongbuk-gu, Seoul",
    mainColor: "#ce1414",
    acceptanceRate: "9%",
  },
  {
    name: "Yonsei University",
    koreanName: "연세대학교",
    city: "Seoul",
    country: "South Korea",
    qsRanking: 55,
    qsRankingYear: 2026,
    rankingSourceNote,
    officialWebsite: "https://www.yonsei.ac.kr/en_sc",
    imageUrl:
      "https://www.yonsei.ac.kr/sites/sc/atchmnfl_mngr/imageSlide/73/temp_1750298387242100.jpg",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/en/thumb/9/95/YonseiUniversityEmblem.svg/1280px-YonseiUniversityEmblem.svg.png",
    description:
      "Yonsei University is one of South Korea's most prestigious universities and a member of the elite SKY universities.",
    programs: ["Global Studies", "Business", "Medicine", "Engineering", "Liberal Arts"],
    tuitionMin: 3600000,
    tuitionMax: 7600000,
    tuitionCurrency: "KRW",
    admissionRequirements: [
      "Online application",
      "High school or university transcripts",
      "Personal statement",
      "Language documents where required",
    ],
    languagesOfInstruction: ["Korean", "English"],
    scholarshipInfo:
      "Scholarships are available through admissions review and international student programs.",
    hasScholarships: true,
    housingInfo:
      "On-campus housing includes international dormitory options with separate application rules.",
    internationalStudentInfo:
      "Yonsei provides dedicated services for international admissions, exchange, and campus adjustment.",
    applicationDeadlines: {
      spring: "Refer to the international admissions notice",
      fall: "Refer to the international admissions notice",
    },
    tags: ["SKY", "Private", "Seoul", "Global"],
    contactEmail: "iadmission@yonsei.ac.kr",
    contactPhone: "+82-2-2123-4131",
    contactAddress: "50 Yonsei-ro, Seodaemun-gu, Seoul",
    mainColor: "#0b24df",
    acceptanceRate: "6%",
  },
  {
    name: "KAIST",
    koreanName: "한국과학기술원",
    city: "Daejeon",
    country: "South Korea",
    qsRanking: 53,
    qsRankingYear: 2026,
    rankingSourceNote,
    officialWebsite: "https://www.kaist.ac.kr/en",
    imageUrl: "https://ingiehonglab.org/wp-content/uploads/2025/09/KAIST.png",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/0/0a/KAIST_logo.svg",
    description:
      "KAIST is a leading science and technology university known for research, engineering, and innovation.",
    programs: ["Computer Science", "Electrical Engineering", "Mechanical Engineering", "AI", "Bioengineering"],
    tuitionMin: 3300000,
    tuitionMax: 7000000,
    tuitionCurrency: "KRW",
    admissionRequirements: [
      "Online application",
      "Recommendation letters",
      "Academic transcripts",
      "English proficiency documentation",
    ],
    languagesOfInstruction: ["English", "Korean"],
    scholarshipInfo:
      "Many admitted international students are considered for tuition support and stipends by program.",
    hasScholarships: true,
    housingInfo:
      "Dormitory housing is commonly available for enrolled students at the Daejeon campus.",
    internationalStudentInfo:
      "KAIST supports international degree students through admissions, visa, housing, and academic services.",
    applicationDeadlines: {
      early: "Usually announced by admissions each cycle",
      regular: "Usually announced by admissions each cycle",
    },
    tags: ["STEM", "Research", "Daejeon", "Technology"],
    contactEmail: "advanced.adm@kaist.ac.kr",
    contactPhone: "+82-42-350-4803",
    contactAddress: "291 Daehak-ro, Yuseong-gu, Daejeon",
    mainColor: "#263ce0",
    acceptanceRate: "6%",
  },
  {
    name: "POSTECH",
    koreanName: "포항공과대학교",
    city: "Pohang",
    country: "South Korea",
    qsRanking: 98,
    qsRankingYear: 2026,
    rankingSourceNote,
    officialWebsite: "https://www.postech.ac.kr/eng",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/GIFT_POSTECH_New_Building.jpg/1280px-GIFT_POSTECH_New_Building.jpg",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/9/93/Postech_Logotype.svg",
    description:
      "POSTECH is a research-intensive university focused on science, engineering, and advanced technology.",
    programs: ["Materials Science", "Chemistry", "Mechanical Engineering", "Computer Science", "Life Sciences"],
    tuitionMin: 3100000,
    tuitionMax: 6800000,
    tuitionCurrency: "KRW",
    admissionRequirements: [
      "Application form",
      "Academic transcripts",
      "Recommendation letters",
      "Study plan",
    ],
    languagesOfInstruction: ["Korean", "English"],
    scholarshipInfo:
      "Graduate assistantships and merit-based aid may be available depending on department funding.",
    hasScholarships: true,
    housingInfo:
      "Campus housing is available for many students, subject to university housing policies.",
    internationalStudentInfo:
      "International support services help with admissions, research placement, and campus life.",
    applicationDeadlines: {
      graduate: "Check department-specific admissions notices",
      undergraduate: "Check annual admissions notices",
    },
    tags: ["STEM", "Research", "Pohang", "Private"],
    contactEmail: "admission@postech.ac.kr",
    contactPhone: "+82-54-279-3610",
    contactAddress: "77 Cheongam-ro, Nam-gu, Pohang",
    mainColor: "#c41230",
    acceptanceRate: "8%",
  },
  {
    name: "Sungkyunkwan University",
    koreanName: "성균관대학교",
    city: "Seoul",
    country: "South Korea",
    qsRanking: 123,
    qsRankingYear: 2026,
    rankingSourceNote,
    officialWebsite: "https://www.skku.edu/eng",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Sungkyunkwan_University_Bicheondang_and_600th_Anniversary_Hall.jpg/1280px-Sungkyunkwan_University_Bicheondang_and_600th_Anniversary_Hall.jpg",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/4/44/Sungkyunkwan_University_-_logotype_%28ko%2Ben%29.svg",
    description:
      "Sungkyunkwan University combines a long academic history with strengths in technology, business, and humanities.",
    programs: ["Business", "Software", "Engineering", "Humanities", "Global Economics"],
    tuitionMin: 3600000,
    tuitionMax: 7600000,
    tuitionCurrency: "KRW",
    admissionRequirements: [
      "Application materials",
      "Academic transcripts",
      "Language or program-specific documents",
      "Interview where required",
    ],
    languagesOfInstruction: ["Korean", "English"],
    scholarshipInfo:
      "Admissions scholarships and continuing scholarships are offered for qualified students.",
    hasScholarships: true,
    housingInfo:
      "Dormitory options are available across Seoul and Suwon campuses, subject to availability.",
    internationalStudentInfo:
      "International services support admissions, exchange, Korean language study, and student life.",
    applicationDeadlines: {
      spring: "Review current international admissions guide",
      fall: "Review current international admissions guide",
    },
    tags: ["Private", "Seoul", "Suwon", "Business"],
    contactEmail: "admission@skku.edu",
    contactPhone: "+82-2-760-1000",
    contactAddress: "25-2 Sungkyunkwan-ro, Jongno-gu, Seoul",
    mainColor: "#0b4ea2",
    acceptanceRate: "18%",
  },
  {
    name: "Hanyang University",
    koreanName: "한양대학교",
    city: "Seoul",
    country: "South Korea",
    qsRanking: 164,
    qsRankingYear: 2026,
    rankingSourceNote,
    officialWebsite: "https://www.hanyang.ac.kr/web/eng",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Hanyang_university_lions_hall.jpg/960px-Hanyang_university_lions_hall.jpg",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/5/51/Hanyang_University_KORENG_logo.svg",
    description:
      "Hanyang University is known for engineering, entrepreneurship, and practical education in Seoul and ERICA campuses.",
    programs: ["Engineering", "Architecture", "Business", "Computer Science", "Design"],
    tuitionMin: 3700000,
    tuitionMax: 7900000,
    tuitionCurrency: "KRW",
    admissionRequirements: [
      "Online application",
      "Academic transcripts",
      "Personal statement",
      "Language score if required",
    ],
    languagesOfInstruction: ["Korean", "English"],
    scholarshipInfo:
      "International student scholarships may be awarded based on admission results and academic performance.",
    hasScholarships: true,
    housingInfo:
      "Dormitory housing is offered with separate application and eligibility requirements.",
    internationalStudentInfo:
      "The international office provides admissions, exchange, and student support services.",
    applicationDeadlines: {
      spring: "Check international office announcement",
      fall: "Check international office announcement",
    },
    tags: ["Engineering", "Private", "Seoul", "ERICA"],
    contactEmail: "intladmission@hanyang.ac.kr",
    contactPhone: "+82-2-2220-0114",
    contactAddress: "222 Wangsimni-ro, Seongdong-gu, Seoul",
    mainColor: "#004098",
    acceptanceRate: "20%",
  },
  {
    name: "Kyung Hee University",
    koreanName: "경희대학교",
    city: "Seoul",
    country: "South Korea",
    qsRanking: 328,
    qsRankingYear: 2026,
    rankingSourceNote,
    officialWebsite: "https://www.khu.ac.kr/eng",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/KHU_Seoul_Campus.jpg/1280px-KHU_Seoul_Campus.jpg",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2b/Kyung_Hee_University_Logo.svg",
    description:
      "Kyung Hee University is a comprehensive private university with global programs and campuses in Seoul and Yongin.",
    programs: ["Hospitality", "International Studies", "Medicine", "Management", "Arts"],
    tuitionMin: 3400000,
    tuitionMax: 7600000,
    tuitionCurrency: "KRW",
    admissionRequirements: [
      "Application form",
      "Academic transcripts",
      "Language documentation",
      "Program-specific materials",
    ],
    languagesOfInstruction: ["Korean", "English"],
    scholarshipInfo:
      "Scholarships are available for selected incoming and continuing international students.",
    hasScholarships: true,
    housingInfo:
      "Dormitory and off-campus housing guidance is available through campus offices.",
    internationalStudentInfo:
      "International support includes admissions, visa guidance, Korean language support, and campus services.",
    applicationDeadlines: {
      spring: "Check current undergraduate or graduate admission guide",
      fall: "Check current undergraduate or graduate admission guide",
    },
    tags: ["Private", "Seoul", "Global", "Hospitality"],
    contactEmail: "admission@khu.ac.kr",
    contactPhone: "+82-2-961-0114",
    contactAddress: "26 Kyungheedae-ro, Dongdaemun-gu, Seoul",
    mainColor: "#8b1d2c",
    acceptanceRate: "22%",
  },
]

async function seedAdminUser() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.warn(
      "Skipping admin seed: set ADMIN_EMAIL and ADMIN_PASSWORD to create the first admin user.",
    )
    return
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)

  await prisma.adminUser.upsert({
    where: { email: ADMIN_EMAIL },
    update: { passwordHash },
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
    },
  })
}

async function main() {
  for (const [index, university] of universities.entries()) {
    const preparedUniversity = enrichUniversity(university, index)

    const savedUniversity = await prisma.university.upsert({
      where: { name: preparedUniversity.name },
      update: preparedUniversity,
      create: preparedUniversity,
    })

    for (const program of buildProgramsForUniversity(preparedUniversity)) {
      await prisma.program.upsert({
        where: { slug: program.slug },
        update: { ...program, universityId: savedUniversity.id },
        create: { ...program, universityId: savedUniversity.id },
      })
    }
  }

  await seedAdminUser()
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
