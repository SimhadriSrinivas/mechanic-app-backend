// src/routes/mechanic.routes.js

const express = require("express");
const router = express.Router();

const {
  registerMechanic,
  getMechanicProfile,
  updateMechanicProfileController,
  updateDutyStatus, 
  getNearbyMechanics, 
} = require("../controllers/mechanic.controller");

/* ================= ROUTES ================= */

// 🔹 Register / complete profile
router.post("/register", registerMechanic);

// 🔹 Get mechanic profile
router.get("/profile", getMechanicProfile);

// 🔹 Update mechanic profile (edit)
router.put("/profile", updateMechanicProfileController);

// 🔹 Update duty status (OnDuty / OffDuty)
router.put("/duty", updateDutyStatus);

router.get("/nearby", getNearbyMechanics);


module.exports = router;
