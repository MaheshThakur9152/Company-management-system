const rateLimit = require('express-rate-limit');

function createLimiter({ windowMs = 60 * 1000, max = 30, message } = {}) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: message || 'Too many requests, please try again later.',
    // Disable internal validations so the middleware doesn't throw on unexpected
    // X-Forwarded-For headers. The app already sets `trust proxy` in `app.js`.
    validate: false
  });
}

module.exports = { createLimiter };
