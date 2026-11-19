import "dotenv/config"
import { readFileSync } from "node:fs"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()
const catalog = JSON.parse(readFileSync(new URL("../data/universities.json", import.meta.url), "utf8"))
const programCatalog = JSON.parse(readFileSync(new URL("../data/programs.json", import.meta.url), "utf8"))
const rankDate = new Date(`${catalog.rankingVerifiedAt}T00:00:00Z`)
const roles = ["President", "Vice President", "International Student Representative", "Academic Affairs Representative", "Welfare Representative", "Events Coordinator", "Communications Officer", "Finance Officer", "Club Representative", "Dormitory Representative", "Department Representative"]

async function seedUniversity(entry) {
  return prisma.$transaction(async tx => {
    const existing = await tx.university.findFirst({ where: { OR: [{ slug: entry.slug }, { name: entry.name }, { officialWebsite: entry.officialWebsite }] } })
    const ranking = {
      qsRanking: entry.qsRankingNumber, qsRankingLabel: entry.qsRanking, qsRankingYear: catalog.rankingYear,
      qsSourceUrl: catalog.rankingSourceUrl,
      rankingSourceNote: `QS World University Rankings ${catalog.rankingYear}; ranking checked ${catalog.rankingVerifiedAt}. Rank bands use their lower bound for sorting. Other fields require their own verification.`,
    }
    const knownPrograms = programCatalog.programs.filter(p => p.universitySlug === entry.slug)
    // Reruns update only the sourced ranking; editorial, image, admissions and contact fields remain intact.
    const university = existing ? await tx.university.update({ where: { id: existing.id }, data: { ...ranking, sourceUrls: [...new Set([...existing.sourceUrls, catalog.rankingSourceUrl])] } })
      : await tx.university.create({ data: {
        name: entry.name, slug: entry.slug, koreanName: entry.koreanName, city: entry.city,
        country: "South Korea", universityType: entry.universityType, officialWebsite: entry.officialWebsite,
        ...ranking, sourceUrls: [catalog.rankingSourceUrl, entry.officialWebsite], lastVerifiedAt: rankDate,
        verificationStatus: "needs verification", description: `${entry.name} is a ${entry.universityType} university in ${entry.city}, South Korea, included in the QS World University Rankings ${catalog.rankingYear} top 1000.`,
        fullDescription: "Consult the linked official university pages for current admissions, tuition, housing and program requirements.",
        imageUrl: entry.campusImageUrl || null, campusImageUrl: entry.campusImageUrl || null,
        logoUrl: entry.logoUrl || null, imageAlt: `${entry.name} campus`, imageSourceUrl: entry.imageSourceUrl || null,
        imageLastVerifiedAt: null, hasScholarships: null, hasDormitory: null, acceptanceRate: null,
        programs: knownPrograms.map(p => p.name), studyLevels: [...new Set(knownPrograms.map(p => p.degreeLevel))],
        tags: [entry.city, `QS ${catalog.rankingYear}`],
      } })
    const council = await tx.studentCouncil.upsert({ where: { universityId: university.id }, update: {}, create: {
      universityId: university.id, name: `${university.name} Student Council`, description: "Council profile awaiting verification. Roles below are placeholders and do not identify real members.",
      verificationStatus: "needs verification", sourceUrl: university.officialWebsite,
    } })
    const existingRoles = await tx.studentCouncilRole.findMany({ where: { councilId: council.id }, select: { roleTitle: true } })
    const missing = roles.filter(roleTitle => !existingRoles.some(role => role.roleTitle === roleTitle))
    if (missing.length) await tx.studentCouncilRole.createMany({ data: missing.map(roleTitle => ({ councilId: council.id, universityId: university.id, roleTitle, description: "Role placeholder; no person has been verified.", status: "pending", verificationStatus: "needs verification" })) })
    for (const program of knownPrograms) {
      const { universitySlug: _slug, ...fields } = program
      await tx.program.upsert({ where: { slug: program.slug }, update: {}, create: { ...fields, universityId: university.id, languageOfInstruction: "Unknown" } })
    }
    return !existing
  })
}

async function main() {
  let inserted = 0
  for (const entry of catalog.universities) inserted += Number(await seedUniversity(entry))
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  if (email && password && password.length >= 12 && Buffer.byteLength(password, "utf8") <= 72 && !/replace|example|password/i.test(password)) {
    const existing = await prisma.adminUser.findUnique({ where: { email } })
    if (!existing) await prisma.adminUser.create({ data: { email, passwordHash: await bcrypt.hash(password, 12), role: "admin" } })
  } else console.log("Admin creation skipped. Set a unique ADMIN_EMAIL and a strong ADMIN_PASSWORD (12–72 bytes).")
  console.log(`Seeded ${catalog.universities.length} QS ${catalog.rankingYear} universities (${inserted} new), sourced programs, and unnamed council roles. Existing editorial data and admin passwords preserved.`)
}
main().catch(error => { console.error(error); process.exitCode = 1 }).finally(() => prisma.$disconnect())
