export class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message)
    this.name = "ApiError"
    this.statusCode = statusCode
    this.details = details
  }
}

export function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next)
  }
}

export function notFoundHandler(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`))
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    next(error)
    return
  }

  const prismaErrors = { P2002: [409, "A record with these details already exists"], P2003: [400, "A referenced record does not exist or is still in use"], P2025: [404, "Record not found"] }
  const known = prismaErrors[error.code]
  const requestedStatus = known?.[0] || error.statusCode || error.status
  const statusCode = Number.isInteger(requestedStatus) && requestedStatus >= 400 && requestedStatus <= 599 ? requestedStatus : 500
  const response = {
    error: {
      message:
        statusCode >= 500 ? "Internal server error" : known?.[1] || (error.type === "entity.parse.failed" ? "Invalid JSON request body" : error.message) || "Request failed",
    },
  }

  if (error.details && statusCode < 500) {
    response.error.details = error.details
  }

  if (statusCode === 500) {
    console.error(error)
  }

  res.status(statusCode).json(response)
}

export function isPrismaMissingRecord(error) {
  return error && error.code === "P2025"
}
