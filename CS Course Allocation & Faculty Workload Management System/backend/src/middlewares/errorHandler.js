const config = require('../config/environment');

/**
 * Centralized Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[Error] ${req.method} ${req.originalUrl}:`, {
    message: err.message,
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
  });

  return res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || null,
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
};

const notFoundHandler = (req, res, next) => {
  return res.status(404).json({
    success: false,
    message: `API Route Not Found: ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
