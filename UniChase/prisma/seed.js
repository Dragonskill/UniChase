import bcrypt from "bcryptjs"
import dotenv from "dotenv"
import { PrismaClient } from "@prisma/client"

dotenv.config({ quiet: true })

const prisma = new PrismaClient()

const lastVerifiedAt = new Date("2026-06-01T00:00:00.000Z")
const qsSourceUrl = "https://www.topuniversities.com/qs-top-uni-wur"
const koreaRankingSourceUrl = "https://truescho.com/en/rankings/country/kr"
const rankingSourceNote =
  "Verified against QS World University Rankings 2026 South Korea listings. Band labels are stored exactly for display; qsRanking stores the lower bound for sorting."
const needsVerification = "needs verification"

// Do not invent real student council people. These are role placeholders only.
const placeholderCouncilRoles = [
  {
    roleTitle: "President",
    responsibilities: ["Represent the student body", "Coordinate student council priorities"],
  },
  {
    roleTitle: "Vice President",
    responsibilities: ["Support council operations", "Coordinate cross-team follow-up"],
  },
  {
    roleTitle: "International Student Representative",
    responsibilities: ["Represent international student concerns", "Help route support and orientation feedback"],
  },
  {
    roleTitle: "Academic Affairs Representative",
    responsibilities: ["Gather academic feedback", "Coordinate academic policy communication"],
  },
  {
    roleTitle: "Welfare Representative",
    responsibilities: ["Monitor student welfare topics", "Support campus life issue escalation"],
  },
]

const universities = [
  {
    name: "Seoul National University",
    koreanName: "서울대학교",
    city: "Seoul",
    universityType: "public",
    qsRanking: 38,
    qsRankingLabel: "#=38",
    officialWebsite: "https://en.snu.ac.kr",
    mainColor: "#15397F",
  },
  {
    name: "Yonsei University",
    koreanName: "연세대학교",
    city: "Seoul",
    universityType: "private",
    qsRanking: 50,
    qsRankingLabel: "#50",
    officialWebsite: "https://www.yonsei.ac.kr/en_sc",
    mainColor: "#0B24DF",
  },
  {
    name: "Korea University",
    koreanName: "고려대학교",
    city: "Seoul",
    universityType: "private",
    qsRanking: 61,
    qsRankingLabel: "#61",
    officialWebsite: "https://www.korea.edu",
    mainColor: "#CE1414",
  },
  {
    name: "Pohang University of Science And Technology (POSTECH)",
    koreanName: "포항공과대학교",
    city: "Pohang",
    universityType: "private",
    qsRanking: 102,
    qsRankingLabel: "#102",
    officialWebsite: "https://www.postech.ac.kr/eng",
    mainColor: "#C41230",
  },
  {
    name: "Sungkyunkwan University (SKKU)",
    koreanName: "성균관대학교",
    city: "Seoul",
    universityType: "private",
    qsRanking: 126,
    qsRankingLabel: "#=126",
    officialWebsite: "https://www.skku.edu/eng",
    mainColor: "#0B4EA2",
  },
  {
    name: "Hanyang University",
    koreanName: "한양대학교",
    city: "Seoul",
    universityType: "private",
    qsRanking: 159,
    qsRankingLabel: "#159",
    officialWebsite: "https://www.hanyang.ac.kr/web/eng",
    mainColor: "#004098",
  },
  {
    name: "Ulsan National Institute of Science and Technology (UNIST)",
    koreanName: "울산과학기술원",
    city: "Ulsan",
    universityType: "public",
    qsRanking: 310,
    qsRankingLabel: "#=310",
    officialWebsite: "https://www.unist.ac.kr",
    mainColor: "#005BAC",
  },
  {
    name: "Kyung Hee University",
    koreanName: "경희대학교",
    city: "Seoul",
    universityType: "private",
    qsRanking: 331,
    qsRankingLabel: "#=331",
    officialWebsite: "https://www.khu.ac.kr/eng",
    mainColor: "#8B1D2C",
  },
  {
    name: "Daegu Gyeongbuk Institute of Science and Technology (DGIST)",
    koreanName: "대구경북과학기술원",
    city: "Daegu",
    universityType: "public",
    qsRanking: 370,
    qsRankingLabel: "#370",
    officialWebsite: "https://www.dgist.ac.kr/eng/",
    mainColor: "#0057A8",
  },
  {
    name: "Gwangju Institute of Science and Technology (GIST)",
    koreanName: "광주과학기술원",
    city: "Gwangju",
    universityType: "public",
    qsRanking: 385,
    qsRankingLabel: "#=385",
    officialWebsite: "https://www.gist.ac.kr/en",
    mainColor: "#003C71",
  },
  {
    name: "Sejong University",
    koreanName: "세종대학교",
    city: "Seoul",
    universityType: "private",
    qsRanking: 392,
    qsRankingLabel: "#=392",
    officialWebsite: "https://en.sejong.ac.kr",
    mainColor: "#B51F2A",
  },
  {
    name: "Pusan National University",
    koreanName: "부산대학교",
    city: "Busan",
    universityType: "public",
    qsRanking: 473,
    qsRankingLabel: "#=473",
    officialWebsite: "https://www.pusan.ac.kr/eng/Main.do",
    mainColor: "#005BAC",
  },
  {
    name: "Chung-Ang University (CAU)",
    koreanName: "중앙대학교",
    city: "Seoul",
    universityType: "private",
    qsRanking: 479,
    qsRankingLabel: "#479",
    officialWebsite: "https://neweng.cau.ac.kr",
    mainColor: "#005BAC",
  },
  {
    name: "Ewha Womans University",
    koreanName: "이화여자대학교",
    city: "Seoul",
    universityType: "private",
    qsRanking: 504,
    qsRankingLabel: "#=504",
    officialWebsite: "https://www.ewha.ac.kr/ewhaen/index.do",
    mainColor: "#00664F",
  },
  {
    name: "Kyungpook National University",
    koreanName: "경북대학교",
    city: "Daegu",
    universityType: "public",
    qsRanking: 519,
    qsRankingLabel: "#=519",
    officialWebsite: "https://en.knu.ac.kr",
    mainColor: "#C0002B",
  },
  {
    name: "Sogang University",
    koreanName: "서강대학교",
    city: "Seoul",
    universityType: "private",
    qsRanking: 558,
    qsRankingLabel: "#=558",
    officialWebsite: "https://wwwe.sogang.ac.kr/wwwe/index_new.html",
    mainColor: "#B5121B",
  },
  {
    name: "Ajou University",
    koreanName: "아주대학교",
    city: "Suwon",
    universityType: "private",
    qsRanking: 563,
    qsRankingLabel: "#=563",
    officialWebsite: "https://www.ajou.ac.kr/en/index.do",
    mainColor: "#0066B3",
  },
  {
    name: "Dongguk University",
    koreanName: "동국대학교",
    city: "Seoul",
    universityType: "private",
    qsRanking: 618,
    qsRankingLabel: "#=618",
    officialWebsite: "https://www.dongguk.edu/eng",
    mainColor: "#F08300",
  },
  {
    name: "Inha University",
    koreanName: "인하대학교",
    city: "Incheon",
    universityType: "private",
    qsRanking: 643,
    qsRankingLabel: "#=643",
    officialWebsite: "https://eng.inha.ac.kr/eng/index.do",
    mainColor: "#003876",
  },
  {
    name: "Konkuk University",
    koreanName: "건국대학교",
    city: "Seoul",
    universityType: "private",
    qsRanking: 654,
    qsRankingLabel: "#=654",
    officialWebsite: "https://www.konkuk.ac.kr/eng",
    mainColor: "#006B3F",
  },
  {
    name: "HUFS - Hankuk (Korea) University of Foreign Studies",
    koreanName: "한국외국어대학교",
    city: "Seoul",
    universityType: "private",
    qsRanking: 680,
    qsRankingLabel: "#=680",
    officialWebsite: "https://www.hufs.ac.kr",
    mainColor: "#003B79",
  },
  {
    name: "Jeonbuk National University",
    koreanName: "전북대학교",
    city: "Jeonju",
    universityType: "public",
    qsRanking: 701,
    qsRankingLabel: "#701-710",
    officialWebsite: "https://www.jbnu.ac.kr/eng/",
    mainColor: "#005BAC",
  },
  {
    name: "The Catholic University of Korea (CUK)",
    koreanName: "가톨릭대학교",
    city: "Gyeonggi",
    universityType: "private",
    qsRanking: 741,
    qsRankingLabel: "#741-750",
    officialWebsite: "https://www.catholic.ac.kr/english/",
    mainColor: "#004C97",
  },
  {
    name: "University of Ulsan",
    koreanName: "울산대학교",
    city: "Ulsan",
    universityType: "private",
    qsRanking: 801,
    qsRankingLabel: "#801-850",
    officialWebsite: "https://en.ulsan.ac.kr",
    mainColor: "#005BAC",
  },
  {
    name: "Chungnam National University",
    koreanName: "충남대학교",
    city: "Daejeon",
    universityType: "public",
    qsRanking: 851,
    qsRankingLabel: "#851-900",
    officialWebsite: "https://plus.cnu.ac.kr/html/en/",
    mainColor: "#005BAC",
  },
  {
    name: "University of Seoul",
    koreanName: "서울시립대학교",
    city: "Seoul",
    universityType: "public",
    qsRanking: 851,
    qsRankingLabel: "#851-900",
    officialWebsite: "https://english.uos.ac.kr",
    mainColor: "#005EB8",
  },
  {
    name: "Chonnam National University",
    koreanName: "전남대학교",
    city: "Gwangju",
    universityType: "public",
    qsRanking: 901,
    qsRankingLabel: "#901-950",
    officialWebsite: "https://global.jnu.ac.kr",
    mainColor: "#005BAC",
  },
  {
    name: "Yeungnam University",
    koreanName: "영남대학교",
    city: "Gyeongsan",
    universityType: "private",
    qsRanking: 901,
    qsRankingLabel: "#901-950",
    officialWebsite: "https://www.yu.ac.kr/english/",
    mainColor: "#007A3D",
  },
]

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function universityData(university) {
  const shortDescription = `${university.name} is a South Korean university listed in the QS World University Rankings 2026.`

  return {
    ...university,
    slug: slugify(university.name),
    country: "South Korea",
    qsRankingYear: 2026,
    rankingSourceNote,
    qsSourceUrl,
    sourceUrls: [qsSourceUrl, koreaRankingSourceUrl, university.officialWebsite],
    lastVerifiedAt,
    imageUrl: null,
    logoUrl: null,
    description: shortDescription,
    fullDescription:
      `${shortDescription} Admissions, tuition, student council, housing, and contact details should be verified from official university sources before publication.`,
    programs: [],
    tuitionMin: null,
    tuitionMax: null,
    tuitionCurrency: "KRW",
    admissionRequirements: [],
    languagesOfInstruction: [],
    scholarshipInfo: null,
    hasScholarships: null,
    hasDormitory: null,
    housingInfo: null,
    internationalStudentInfo: null,
    studentLife: null,
    requiredDocuments: [],
    applicationSteps: [],
    studyLevels: [],
    applicationDeadlines: null,
    applicationOpenDate: null,
    applicationDeadline: null,
    scholarshipDeadline: null,
    documentDeadline: null,
    tags: ["QS World University Rankings 2026", university.city, university.universityType],
    contactEmail: null,
    contactPhone: null,
    contactAddress: null,
    acceptanceRate: null,
  }
}

async function seedAdminUser() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD === "replace-with-a-strong-password") {
    console.warn("Skipping admin seed: set ADMIN_EMAIL and ADMIN_PASSWORD to create the first admin user.")
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

async function seedCouncil(university) {
  const council = await prisma.studentCouncil.upsert({
    where: { universityId: university.id },
    update: {
      name: `${university.name} Student Council`,
      officialName: null,
      description:
        "Student council structure placeholder. Real members are not listed until verified from official public sources or added by a moderator.",
      websiteUrl: null,
      socialUrl: null,
      contactEmail: null,
      sourceUrl: university.officialWebsite,
      verificationStatus: needsVerification,
      lastVerifiedAt: null,
    },
    create: {
      universityId: university.id,
      name: `${university.name} Student Council`,
      officialName: null,
      description:
        "Student council structure placeholder. Real members are not listed until verified from official public sources or added by a moderator.",
      websiteUrl: null,
      socialUrl: null,
      contactEmail: null,
      sourceUrl: university.officialWebsite,
      verificationStatus: needsVerification,
      lastVerifiedAt: null,
    },
  })

  for (const role of placeholderCouncilRoles) {
    const existing = await prisma.studentCouncilRole.findFirst({
      where: {
        councilId: council.id,
        universityId: university.id,
        roleTitle: role.roleTitle,
        displayName: null,
      },
    })

    const data = {
      councilId: council.id,
      universityId: university.id,
      adminUserId: null,
      displayName: null,
      roleTitle: role.roleTitle,
      department: null,
      description: "Role placeholder only. No real student name has been verified.",
      responsibilities: role.responsibilities,
      contactEmail: null,
      contactUrl: null,
      avatarUrl: null,
      status: "pending",
      verificationStatus: needsVerification,
      sourceUrl: university.officialWebsite,
    }

    if (existing) {
      await prisma.studentCouncilRole.update({ where: { id: existing.id }, data })
    } else {
      await prisma.studentCouncilRole.create({ data })
    }
  }
}

async function main() {
  let inserted = 0
  let updated = 0

  for (const university of universities) {
    const data = universityData(university)
    const existing = await prisma.university.findFirst({
      where: {
        OR: [{ name: university.name }, { slug: data.slug }, { officialWebsite: university.officialWebsite }],
      },
      select: { id: true },
    })

    const savedUniversity = existing
      ? await prisma.university.update({
          where: { id: existing.id },
          data: {
            name: university.name,
            ...data,
          },
        })
      : await prisma.university.create({
          data: {
            name: university.name,
            ...data,
          },
        })

    if (existing) {
      updated += 1
    } else {
      inserted += 1
    }

    await seedCouncil(savedUniversity)
  }

  await seedAdminUser()

  console.log("UniChase QS 2026 Korea university seed complete")
  console.log(`Inserted universities: ${inserted}`)
  console.log(`Updated universities: ${updated}`)
  console.log(`QS 2026 South Korea top-1000 universities seeded: ${universities.length}`)
  console.log(`Student council placeholders seeded: ${universities.length}`)
  console.log(`Placeholder roles per council: ${placeholderCouncilRoles.length}`)
  console.log(`Sources: ${qsSourceUrl}, ${koreaRankingSourceUrl}`)
  console.log("No real student council people were invented.")
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
