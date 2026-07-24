/**
 * Global Express error-handling middleware.
 * Must be registered AFTER all routes (4 parameters).
 */

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500
  const message = err.message || 'Internal Server Error'

  // Don't leak stack traces in production
  const payload = {
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  }

  console.error(`[ERROR] ${req.method} ${req.originalUrl} → ${status}: ${message}`)

  res.status(status).json(payload)
}

module.exports = errorHandler
