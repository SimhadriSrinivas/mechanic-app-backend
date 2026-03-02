// src/utils/rateLimiter.js
const { RateLimiterMemory } = require('rate-limiter-flexible');
const config = require('../config');

const limiter = new RateLimiterMemory({
  points: config.rateLimiter.points,
  duration: config.rateLimiter.duration
});

async function consume(key) {
  return limiter.consume(key);
}

module.exports = { consume };
