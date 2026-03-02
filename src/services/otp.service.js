// src/services/otp.service.js

const crypto = require("crypto");
const config = require("../config");
const { info } = require("../utils/logger");

// In-memory OTP store
// For production, replace with Redis
const otps = new Map();

/* ====================================================
   OTP GENERATION
   ==================================================== */

/**
 * generateCode
 * - returns secure 6-digit OTP as string
 */
function generateCode() {
  return String(crypto.randomInt(100000, 999999));
}

/**
 * createOtp
 * - creates OTP
 * - stores expiry & attempts
 */
function createOtp(phone) {
  const code = generateCode();

  // FIXED EXPIRY LOGIC
  const expiresAt =
    Date.now() + config.otpExpiryMinutes * 60 * 1000;

  otps.set(phone, {
    code,
    expiresAt,
    attempts: 0,
  });

  info(
    `OTP created for ${phone}, expires at ${new Date(
      expiresAt
    ).toISOString()}`
  );

  return code;
}

/* ====================================================
   OTP VERIFICATION
   ==================================================== */

/**
 * verifyOtp
 * - validates OTP
 * - limits attempts
 */
function verifyOtp(phone, code) {
  const record = otps.get(phone);

  if (!record) {
    return { ok: false, reason: "not_found" };
  }

  //  Expired
  if (Date.now() > record.expiresAt) {
    otps.delete(phone);
    return { ok: false, reason: "expired" };
  }

  //  Attempts limit
  record.attempts += 1;
  if (record.attempts > 5) {
    otps.delete(phone);
    return { ok: false, reason: "too_many_attempts" };
  }

  //  Wrong OTP
  if (record.code !== String(code)) {
    otps.set(phone, record);
    return { ok: false, reason: "invalid" };
  }

  //  Success
  otps.delete(phone);
  return { ok: true };
}

module.exports = {
  createOtp,
  verifyOtp,
};
