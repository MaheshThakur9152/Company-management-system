const rateLimit = require('express-rate-limit');

function createLimiter({ windowMs = 60 * 1000, max = 30, message } = {}) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: message || 'Too many requests, please try again later.'
  });
}

module.exports = { createLimiter };
