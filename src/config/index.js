// src/config/index.js

require("dotenv").config();

/* ================= HELPER ================= */
function required(name) {
  if (!process.env[name]) {
    console.warn(`Missing environment variable: ${name}`);
  }
  return process.env[name];
}

module.exports = {
  /* ================= SERVER ================= */
  port: process.env.PORT || 3000,

  /* ================= TWILIO ================= */
  twilio: {
    accountSid: required("TWILIO_ACCOUNT_SID"),
    authToken: required("TWILIO_AUTH_TOKEN"),
    from: required("TWILIO_FROM"),
  },

  /* ================= APPWRITE ================= */
  appwrite: {
    endpoint: required("APPWRITE_ENDPOINT"),
    projectId: required("APPWRITE_PROJECT_ID"),
    apiKey: required("APPWRITE_API_KEY"),

    // SINGLE DATABASE
    databaseId: required("APPWRITE_DATABASE_ID"),

    // COLLECTIONS
    otpCollectionId: required("APPWRITE_OTP_COLLECTION_ID"),
    mechanicCollectionId: required("APPWRITE_MECHANIC_COLLECTION_ID"),
    serviceRequestCollectionId: required(
      "APPWRITE_SERVICE_REQUEST_COLLECTION_ID"
    ),
  },

  /* ================= OTP ================= */
  otpExpiryMinutes: parseInt(
    process.env.OTP_EXPIRY_MINUTES || "5",
    10
  ),

  /* ================= RATE LIMITER ================= */
  rateLimiter: {
    points: parseInt(process.env.RATE_LIMIT_POINTS || "5", 10),
    duration: parseInt(process.env.RATE_LIMIT_DURATION || "60", 10),
  },
};