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

// ✅ Create new service request
router.post("/create", createRequest);

// ❌ Removed cancelRequest (not implemented in controller)
// ❌ Removed getServiceRequestByIdController (not implemented)

/* =====================================================
   MECHANIC ROUTES
===================================================== */

// ✅ Accept a pending request
router.post("/accept", acceptRequest);

// ✅ Update live mechanic GPS location
router.post("/update-location", updateMechanicLocation);

// ✅ Get user service history
router.get("/user-history", userHistory);

// ✅ Get mechanic history
router.get("/mechanic-history", mechanicHistory);

// ✅ Get active service requests (KEEP LAST GET ROUTE)
router.get("/", getActiveServiceRequests);

module.exports = router;