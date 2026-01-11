const rateLimit = require('express-rate-limit');

function createLimiter({ windowMs = 60 * 1000, max = 30, message } = {}) {
  console.log('createLimiter: windowMs=' + windowMs + ', max=' + max + ', validate=false, keyGenerator=explicit');
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: message || 'Too many requests, please try again later.',
    // Disable internal validations so the middleware doesn't throw on unexpected
    // X-Forwarded-For headers. The app already sets `trust proxy` in `app.js`.
    validate: false,
    // Provide an explicit keyGenerator to avoid triggering the package's
    // default keyGenerator which runs the X-Forwarded-For/trust-proxy
    // validations.
    keyGenerator: (req) => req.ip
  });
}

module.exports = { createLimiter };
