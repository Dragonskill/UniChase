import { ApiError } from "./errors.js"

export async function assertOwnedLinks(prisma, userId, data) {
  for (const [field, model] of [["applicationId", "userApplication"], ["checklistItemId", "checklistItem"]]) {
    if (data[field] == null) continue
    const record = await prisma[model].findFirst({ where: { id: data[field], userId }, select: { id: true } })
    if (!record) throw new ApiError(404, "Linked record not found")
  }
  if (data.roadmapStepId != null) {
    const id = Number(data.roadmapStepId)
    if (!Number.isSafeInteger(id) || id <= 0) throw new ApiError(400, "Invalid roadmap step id")
    const step = await prisma.roadmapStep.findFirst({ where: { id, roadmap: { userId } }, select: { id: true } })
    if (!step) throw new ApiError(404, "Linked roadmap step not found")
  }
  if (data.universityId != null) {
    const university = await prisma.university.findUnique({ where: { id: data.universityId }, select: { id: true } })
    if (!university) throw new ApiError(404, "University not found")
  }
}

export function assertDateRange(data) {
  if (data.endDate && data.startDate && new Date(data.endDate) < new Date(data.startDate)) throw new ApiError(400, "End date must not be before start date")
}

export function mapPrivateDocument(document) {
  if (!document) return document
  const { fileUrl, ...tracking } = document
  void fileUrl
  return tracking
}
