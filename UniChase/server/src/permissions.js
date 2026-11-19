import { ApiError } from "./errors.js"

const rolePermissions = {
  admin: ["all"],
  moderator: ["community", "reviews", "reports", "notifications", "analytics", "support"],
  university_editor: ["universities", "student-councils", "verification"],
  content_editor: ["content", "notifications"],
  community_moderator: ["community", "reports"],
}

export function canAccess(admin, permission) {
  const permissions = rolePermissions[admin?.role] || []
  return permissions.includes("all") || permissions.includes(permission)
}

export function requirePermission(req, permission) {
  if (!canAccess(req.admin, permission)) throw new ApiError(403, "Moderator role does not allow this action")
}

export function permit(permission) {
  return (req, res, next) => {
    try { requirePermission(req, permission); next() } catch (error) { next(error) }
  }
}
