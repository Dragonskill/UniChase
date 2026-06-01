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
    officialWebsite: "https://www.yonsei.ac.kr/en_sc/",
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

const universityImages = {
  "Seoul National University": {
    campusImageUrl: "https://en.snu.ac.kr/webdata/eng/gallery/thumb/fb9z62dzd5fz1dbz925z112zdf6z1b3zf30z304zfd.jpg",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/7/77/Seoul_national_university_emblem.svg/250px-Seoul_national_university_emblem.svg.png",
    imageSourceUrl: "https://en.snu.ac.kr",
  },
  "Yonsei University": {
    campusImageUrl: "https://www.yonsei.ac.kr/sites/sc/atchmnfl_mngr/imageSlide/73/temp_1750298387242100.jpg",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/9/95/YonseiUniversityEmblem.svg/250px-YonseiUniversityEmblem.svg.png",
    imageSourceUrl: "https://www.yonsei.ac.kr/en_sc/",
  },
  "Korea University": {
    campusImageUrl: "https://uploaded.kcampus.kr/1_5f0ebd83_623d_4f9c_9556_52c82dbd5a15_0de2b3e5f9.jpg",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/f/f6/Korea_University_Global_Symbol.svg/250px-Korea_University_Global_Symbol.svg.png",
    imageSourceUrl: "https://en.wikipedia.org/wiki/Korea_University",
  },
  "Pohang University of Science And Technology (POSTECH)": {
    campusImageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/cb/POSTECH_road.jpg",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/a/a5/POSTECH_emblem.svg/250px-POSTECH_emblem.svg.png",
    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:POSTECH_road.jpg",
  },
  "Sungkyunkwan University (SKKU)": {
    campusImageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d6/Sungkyunkwan_campus.jpg",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/4/40/Sungkyunkwan_University_seal.svg/330px-Sungkyunkwan_University_seal.svg.png",
    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Sungkyunkwan_campus.jpg",
  },
  "Hanyang University": {
    campusImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Lions_Lake%2C_Hanyang_University_Campus%2C_Ansan.jpg/1280px-Lions_Lake%2C_Hanyang_University_Campus%2C_Ansan.jpg",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/0/0a/Hanyang_University_new_UI.svg/250px-Hanyang_University_new_UI.svg.png",
    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Lions_Lake,_Hanyang_University_Campus,_Ansan.jpg",
  },
  "Ulsan National Institute of Science and Technology (UNIST)": {
    campusImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/UNIST_campus_2015.jpg/1280px-UNIST_campus_2015.jpg",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/4/48/Latest_UNIST_logo.jpg",
    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:UNIST_campus_2015.jpg",
  },
  "Kyung Hee University": {
    campusImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Kyung_Hee_Univ._Administration_Building%28Seoul_Campus%29.JPG/1280px-Kyung_Hee_Univ._Administration_Building%28Seoul_Campus%29.JPG",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/4/41/Kyung_Hee_University_emblem.png",
    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Kyung_Hee_Univ._Administration_Building(Seoul_Campus).JPG",
  },
  "Daegu Gyeongbuk Institute of Science and Technology (DGIST)": {
    campusImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/DGIST_campus_academic_buildings.jpg/1280px-DGIST_campus_academic_buildings.jpg",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/a/a8/DGIST_Emblem_2.png",
    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:DGIST_campus_academic_buildings.jpg",
  },
  "Gwangju Institute of Science and Technology (GIST)": {
    campusImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/GIST_Student_Union_Building_1.jpg/1280px-GIST_Student_Union_Building_1.jpg",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/d/d4/Gwangju_Institute_of_Science_and_Technology_%28logo%29.jpg",
    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:GIST_Student_Union_Building_1.jpg",
  },
  "Sejong University": {
    campusImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Sejong_University_Front_Gate.jpg/960px-Sejong_University_Front_Gate.jpg",
    imageSourceUrl: "https://en.wikipedia.org/wiki/Sejong_University",
  },
  "Pusan National University": {
    campusImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Pusan_Natl_Univ_by_Ficell_006.jpg/960px-Pusan_Natl_Univ_by_Ficell_006.jpg",
    imageSourceUrl: "https://en.wikipedia.org/wiki/Pusan_National_University",
  },
  "Chung-Ang University (CAU)": {
    campusImageUrl: "https://upload.wikimedia.org/wikipedia/commons/f/f0/%EC%A4%91%EC%95%99%EB%8C%80_%ED%8F%89%EB%8F%99%EC%BA%A0%ED%8D%BC%EC%8A%A4.jpg",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/0/0b/CAU_emblem.png",
    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:%EC%A4%91%EC%95%99%EB%8C%80_%ED%8F%89%EB%8F%99%EC%BA%A0%ED%8D%BC%EC%8A%A4.jpg",
  },
  "Ewha Womans University": {
    campusImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Ewha_Womans_University_Campus.JPG/1280px-Ewha_Womans_University_Campus.JPG",
    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Ewha_Womans_University_Campus.JPG",
  },
  "Kyungpook National University": {
    campusImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/KNU_Daegu_Campus_MB.JPG/1280px-KNU_Daegu_Campus_MB.JPG",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/6/6b/Knuemblem00.jpg",
    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:KNU_Daegu_Campus_MB.JPG",
  },
  "Sogang University": {
    campusImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Administration_Building_at_Sogang_University%2C_Seoul.jpg/1280px-Administration_Building_at_Sogang_University%2C_Seoul.jpg",
    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Administration_Building_at_Sogang_University,_Seoul.jpg",
  },
  "Ajou University": {
    campusImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/0-campus-sm-Ajou.jpg/1280px-0-campus-sm-Ajou.jpg",
    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:0-campus-sm-Ajou.jpg",
  },
  "Dongguk University": {
    campusImageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d0/Spring_in_DONGGUK_UNIVERSITY.jpg",
    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Spring_in_DONGGUK_UNIVERSITY.jpg",
  },
  "Inha University": {
    campusImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Q1593043_Inha_University_A02.jpg/1280px-Q1593043_Inha_University_A02.jpg",
    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Q1593043_Inha_University_A02.jpg",
  },
  "Konkuk University": {
    campusImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Ilgam_Lake_in_the_fall.jpg/960px-Ilgam_Lake_in_the_fall.jpg",
    imageSourceUrl: "https://en.wikipedia.org/wiki/Konkuk_University",
  },
  "HUFS - Hankuk (Korea) University of Foreign Studies": {
    campusImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Hankuk_University_of_Foreign_Studies%2C_Seoul_Campus.jpg/960px-Hankuk_University_of_Foreign_Studies%2C_Seoul_Campus.jpg",
    imageSourceUrl: "https://en.wikipedia.org/wiki/Hankuk_University_of_Foreign_Studies",
  },
  "Jeonbuk National University": {
    campusImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Jeonbuk_national_university_20230408_001.jpg/1280px-Jeonbuk_national_university_20230408_001.jpg",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Emblem_of_Jeonbuk_National_University.png/960px-Emblem_of_Jeonbuk_National_University.png",
    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Jeonbuk_national_university_20230408_001.jpg",
  },
  "The Catholic University of Korea (CUK)": {
    campusImageUrl: "https://upload.wikimedia.org/wikipedia/commons/6/64/%EA%B9%80%EC%88%98%ED%99%98%EC%B6%94%EA%B8%B0%EA%B2%BD%EA%B5%AD%EC%A0%9C%EA%B4%80.jpg",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Catholic_University_of_Korea_logo.svg/960px-Catholic_University_of_Korea_logo.svg.png",
    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:%EA%B9%80%EC%88%98%ED%99%98%EC%B6%94%EA%B8%B0%EA%B2%BD%EA%B5%AD%EC%A0%9C%EA%B4%80.jpg",
  },
  "University of Ulsan": {
    campusImageUrl: "https://upload.wikimedia.org/wikipedia/commons/3/39/UOU_main_hall.png",
    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:UOU_main_hall.png",
  },
  "Chungnam National University": {
    campusImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Chungnam_University_main_gate.jpg/1280px-Chungnam_University_main_gate.jpg",
    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Chungnam_University_main_gate.jpg",
  },
  "University of Seoul": {
    campusImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/%EC%84%9C%EC%9A%B8%EC%8B%9C%EB%A6%BD%EB%8C%80%ED%95%99%EA%B5%90_%EB%B2%95%ED%95%99%EA%B4%80.jpg/1280px-%EC%84%9C%EC%9A%B8%EC%8B%9C%EB%A6%BD%EB%8C%80%ED%95%99%EA%B5%90_%EB%B2%95%ED%95%99%EA%B4%80.jpg",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/University_of_Seoul.svg/960px-University_of_Seoul.svg.png",
    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:%EC%84%9C%EC%9A%B8%EC%8B%9C%EB%A6%BD%EB%8C%80%ED%95%99%EA%B5%90_%EB%B2%95%ED%95%99%EA%B4%80.jpg",
  },
  "Chonnam National University": {
    campusImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/518memorial_hall_in_Chonnam_National_University.JPG/1280px-518memorial_hall_in_Chonnam_National_University.JPG",
    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:518memorial_hall_in_Chonnam_National_University.JPG",
  },
  "Yeungnam University": {
    campusImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Yeungnam_University_Campus_in_Autumn.jpg/1280px-Yeungnam_University_Campus_in_Autumn.jpg",
    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Yeungnam_University_Campus_in_Autumn.jpg",
  },
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function universityData(university) {
  const imageData = universityImages[university.name] || {}
  const shortDescription = `${university.name} is a South Korean university listed in the QS World University Rankings 2026.`
  const sourceUrls = [qsSourceUrl, koreaRankingSourceUrl, university.officialWebsite, imageData.imageSourceUrl].filter(Boolean)

  return {
    ...university,
    slug: slugify(university.name),
    country: "South Korea",
    qsRankingYear: 2026,
    rankingSourceNote,
    qsSourceUrl,
    sourceUrls: [...new Set(sourceUrls)],
    lastVerifiedAt,
    imageUrl: imageData.campusImageUrl || null,
    logoUrl: imageData.logoUrl || null,
    campusImageUrl: imageData.campusImageUrl || null,
    imageAlt: `${university.name} campus image`,
    imageSourceUrl: imageData.imageSourceUrl || university.officialWebsite,
    imageLastVerifiedAt: lastVerifiedAt,
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
