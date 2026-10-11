const rateLimit = require('express-rate-limit');

// General API rate limiter: 120 requests per minute
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again in a minute.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for AI generation and OSM endpoints: 30 requests per minute
const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: 'AI Redressal rate limit exceeded. Please wait a moment before sending another query.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  aiLimiter
};
