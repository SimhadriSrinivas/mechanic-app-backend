// src/routes/auth.routes.js

const express = require("express");
const {
  sendOtpHandler,
  verifyOtpHandler,
} = require("../controllers/auth.controller");

const router = express.Router();

/**
 * POST /api/auth/send-otp
 * Body: { phone }
 */
router.post("/send-otp", sendOtpHandler);

/**
 * POST /api/auth/verify-otp
 * Body: { phone, otp, role }
 */
router.post("/verify-otp", verifyOtpHandler);

module.exports = router;
