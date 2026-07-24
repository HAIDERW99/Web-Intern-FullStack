/**
 * Lightweight request-body validation helper.
 * Usage:  validate(['field1', 'field2'])(req, res, next)
 */

function validate(requiredFields) {
  return (req, res, next) => {
    const missing = requiredFields.filter(
      (field) => req.body[field] === undefined || req.body[field] === null || req.body[field] === ''
    )
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required field(s): ${missing.join(', ')}`,
      })
    }
    next()
  }
}

module.exports = validate
