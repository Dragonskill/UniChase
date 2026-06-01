import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { getJwtSecret } from "./config.js"
import { ApiError, asyncHandler } from "./errors.js"

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash)
}

export function signAdminToken(admin) {
  return jwt.sign(
    {
      sub: String(admin.id),
      email: admin.email,
      role: "admin",
      adminRole: admin.role || "admin",
    },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" },
  )
}

export function signStudentToken(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      email: user.email,
      role: "student",
    },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" },
  )
}

export function requireAdmin(prisma) {
  return asyncHandler(async (req, res, next) => {
    const authorization = req.headers.authorization || ""
    const match = authorization.match(/^Bearer\s+(.+)$/i)

    if (!match) {
      throw new ApiError(401, "Admin authentication required")
    }

    let payload

    try {
      payload = jwt.verify(match[1], getJwtSecret())
    } catch {
      throw new ApiError(401, "Invalid or expired admin token")
    }

    if (!payload || payload.role !== "admin" || !payload.sub) {
      throw new ApiError(401, "Invalid admin token")
    }

    const admin = await prisma.adminUser.findUnique({
      where: { id: Number(payload.sub) },
      select: { id: true, email: true, role: true },
    })

    if (!admin) {
      throw new ApiError(401, "Admin user no longer exists")
    }

    req.admin = admin
    next()
  })
}

export function requireStudent(prisma) {
  return asyncHandler(async (req, res, next) => {
    const authorization = req.headers.authorization || ""
    const match = authorization.match(/^Bearer\s+(.+)$/i)

    if (!match) {
      throw new ApiError(401, "Student authentication required")
    }

    let payload

    try {
      payload = jwt.verify(match[1], getJwtSecret())
    } catch {
      throw new ApiError(401, "Invalid or expired student token")
    }

    if (!payload || payload.role !== "student" || !payload.sub) {
      throw new ApiError(401, "Invalid student token")
    }

    const user = await prisma.studentUser.findUnique({
      where: { id: Number(payload.sub) },
      select: { id: true, email: true, name: true },
    })

    if (!user) {
      throw new ApiError(401, "Student user no longer exists")
    }

    req.user = user
    next()
  })
}
