// src/controllers/auth.controller.js

const { sendSms } = require("../services/twilio.service");
const { createOtp, verifyOtp } = require("../services/otp.service");
const {
  saveUserLogin,
  saveMechanicLogin,
} = require("../services/appwrite.service");
const rateLimiter = require("../utils/rateLimiter");
const { info, error } = require("../utils/logger");

/* ================= PHONE NORMALIZER ================= */

function normalizePhone(phone) {
  if (!phone) return phone;

  // remove spaces, dashes etc
  let cleaned = phone.replace(/\D/g, "");

  // remove India country code 91
  if (cleaned.startsWith("91") && cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  }

  return cleaned;
}

/* ====================================================
   SEND OTP
==================================================== */

async function sendOtpHandler(req, res) {
  try {
    const phone = req.body?.phone;

    if (!phone) {
      return res.status(400).json({
        ok: false,
        message: "Phone is required in E.164 format (ex: +919876543210)",
      });
    }

    try {
      await rateLimiter.consume(req.ip);
    } catch {
      return res.status(429).json({
        ok: false,
        message: "Too many requests. Please try again later.",
      });
    }

    const code = createOtp(phone);

    const text = `Your MEC App OTP is ${code}. It expires in ${
      process.env.OTP_EXPIRY_MINUTES || 5
    } minutes.`;

    await sendSms(phone, text);

    info("[OTP] Sent to", phone);

    return res.json({
      ok: true,
      message: "OTP sent successfully",
    });
  } catch (err) {
    error("sendOtpHandler:", err.message);
    return res.status(500).json({
      ok: false,
      message: "Server error",
    });
  }
}

/* ====================================================
   VERIFY OTP
==================================================== */

async function verifyOtpHandler(req, res) {
  try {
    let { phone, otp, role } = req.body || {};

    if (!phone || !otp || !role) {
      return res.status(400).json({
        ok: false,
        message: "phone, otp and role are required",
      });
    }

    if (!["user", "mechanic"].includes(role)) {
      return res.status(400).json({
        ok: false,
        message: "Invalid role",
      });
    }

    const result = verifyOtp(phone, String(otp));

    if (!result.ok) {
      return res.status(400).json({
        ok: false,
        message: result.reason || "Invalid OTP",
      });
    }

    // 🔥 Normalize before saving to DB
    const normalizedPhone = normalizePhone(phone);

    /* ================= USER FLOW ================= */

    if (role === "user") {
      await saveUserLogin(normalizedPhone);

      return res.json({
        ok: true,
        role: "user",
        profile: {
          exists: true,
        },
      });
    }

    /* ================= MECHANIC FLOW ================= */

    const mechanic = await saveMechanicLogin(normalizedPhone);

    if (!mechanic) {
      return res.status(500).json({
        ok: false,
        message: "Failed to create mechanic profile",
      });
    }

    const isCompleted = mechanic.profile_completed === true;

    info("[verifyOtpHandler] mechanic:", mechanic.$id);
    info("[verifyOtpHandler] profile_completed:", isCompleted);

    return res.json({
      ok: true,
      role: "mechanic",
      message: "OTP verified successfully",
      mechanicId: mechanic.$id,
      profile: {
        exists: true,
        completed: isCompleted,
      },
    });
  } catch (err) {
    error("verifyOtpHandler:", err.message);
    return res.status(500).json({
      ok: false,
      message: "Server error",
    });
  }
}

module.exports = {
  sendOtpHandler,
  verifyOtpHandler,
};
