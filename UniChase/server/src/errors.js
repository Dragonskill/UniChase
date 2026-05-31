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

  const statusCode = error.statusCode || 500
  const response = {
    error: {
      message:
        statusCode === 500 ? "Internal server error" : error.message || "Request failed",
    },
  }

  if (error.details) {
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
