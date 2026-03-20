// src/routes/service.routes.js

const express = require("express");
const router = express.Router();

const {
  createRequest,
  acceptRequest,
  updateMechanicLocation,
  getActiveServiceRequests,
  userHistory,
  mechanicHistory,
  completeService, // ✅ NEW IMPORT
} = require("../controllers/service.controller");

/*
|--------------------------------------------------------------------------
| SERVICE REQUEST ROUTES
|--------------------------------------------------------------------------
| Mounted in app.js as:
| app.use("/api/service", serviceRoutes);
|--------------------------------------------------------------------------
*/

/* =====================================================
   USER ROUTES
===================================================== */

// Create a new service request
router.post("/create", createRequest);

// Get user service history
router.get("/user-history", userHistory);

/* =====================================================
   MECHANIC ROUTES
===================================================== */

// Accept a pending request
router.post("/accept", acceptRequest);

// Update mechanic live GPS location
router.post("/update-location", updateMechanicLocation);

// Complete service + payment (🔥 NEW)
router.post("/complete-service", completeService);

// Get mechanic service history
router.get("/mechanic-history", mechanicHistory);

/* =====================================================
   ACTIVE REQUESTS (KEEP LAST)
===================================================== */

// Get active service requests
// Example:
// GET /api/service?mechanicPhone=XXXXXXXXXX
router.get("/", getActiveServiceRequests);

module.exports = router;
