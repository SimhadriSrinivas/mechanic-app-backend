// src/config/index.js

require("dotenv").config();

module.exports = {
  /* ================= SERVER ================= */
  port: process.env.PORT || 3000,

  /* ================= TWILIO ================= */
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    from: process.env.TWILIO_FROM,
  },

  /* ================= APPWRITE ================= */
  appwrite: {
    endpoint: process.env.APPWRITE_ENDPOINT,
    projectId: process.env.APPWRITE_PROJECT_ID,
    apiKey: process.env.APPWRITE_API_KEY,

    // SINGLE DATABASE
    databaseId: process.env.APPWRITE_DATABASE_ID,

    // COLLECTIONS
    otpCollectionId: process.env.APPWRITE_OTP_COLLECTION_ID,
    mechanicCollectionId: process.env.APPWRITE_MECHANIC_COLLECTION_ID,
    serviceRequestCollectionId:
      process.env.APPWRITE_SERVICE_REQUEST_COLLECTION_ID,
  },

  /* ================= OTP ================= */
  otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || "5", 10),

  /* ================= RATE LIMITER ================= */
  rateLimiter: {
    points: parseInt(process.env.RATE_LIMIT_POINTS || "5", 10),
    duration: parseInt(process.env.RATE_LIMIT_DURATION || "60", 10),
  },
};
