import { ApiError } from "./errors.js"

export function parsePagination(query = {}, defaultLimit = 50, maxLimit = 100) {
  const page = query.page === undefined ? 1 : Number(query.page)
  const limit = query.limit === undefined ? defaultLimit : Number(query.limit)
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000 || !Number.isSafeInteger(limit) || limit < 1 || limit > maxLimit) {
    throw new ApiError(400, `page must be a positive integer and limit must be between 1 and ${maxLimit}`)
  }
  return { page, limit, skip: (page - 1) * limit, take: limit }
}
