import { Router } from "express"
import { ApiError, asyncHandler } from "../errors.js"
import { managedContentKinds } from "../validation.js"

function parseKind(value) {
  if (!managedContentKinds.includes(value)) throw new ApiError(404, "Managed content type not found")
  return value
}

export function createContentRouter(prisma) {
  const router = Router()
  router.get("/:kind", asyncHandler(async (req, res) => {
    const kind = parseKind(req.params.kind)
    const content = await prisma.managedContent.findUnique({ where: { kind } })
    res.json({
      data: content?.payload ?? null,
      meta: content ? { kind, updatedAt: content.updatedAt } : { kind, fallback: true },
    })
  }))
  return router
}
