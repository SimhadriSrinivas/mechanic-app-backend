const crypto = require("crypto");

const ALGORITHM = "aes-256-cbc";

// AADHAAR_SECRET must be 32 bytes (64 hex chars)
const SECRET_KEY = Buffer.from(process.env.AADHAAR_SECRET, "hex");

function encryptAadhaar(aadhaar) {
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  let encrypted = cipher.update(aadhaar, "utf8", "hex");
  encrypted += cipher.final("hex");

  // store iv + encrypted value
  return `${iv.toString("hex")}:${encrypted}`;
}

function getLast4Digits(aadhaar) {
  return aadhaar.slice(-4);
}

module.exports = { encryptAadhaar, getLast4Digits };
