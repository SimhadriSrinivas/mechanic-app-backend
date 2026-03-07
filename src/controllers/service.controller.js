// src/controllers/service.controller.js

const {
  createServiceRequest,
  getUserHistory,
  getMechanicHistory,
  getServiceRequestById,
  updateServiceRequest,
  getAllServiceRequests,
} = require("../services/appwrite.service");

/* =====================================
   PHONE NORMALIZER
===================================== */

function normalizePhone(phone) {
  if (!phone) return "";

  let cleaned = phone.toString().trim();

  // remove spaces
  cleaned = cleaned.replace(/\s+/g, "");

  // remove leading +
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  }

  return cleaned;
}

/* =====================================
   CREATE REQUEST
===================================== */

async function createRequest(req, res) {
  try {
    const { user_phone, user_lat, user_lng, service, vehicle_type } = req.body;

    if (
      !user_phone ||
      user_lat === undefined ||
      user_lng === undefined ||
      !service ||
      !vehicle_type
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const request = await createServiceRequest({
      user_phone,
      user_lat,
      user_lng,
      service,
      vehicle_type,
      status: "pending",
      mechanic_phone: null,
      mechanic_lat: null,
      mechanic_lng: null,
      acceptedAt: null,
      cancelled_by: null,
    });

    return res.status(201).json({
      success: true,
      data: request,
    });
  } catch (err) {
    console.error("createRequest error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

/* =====================================
   ACCEPT REQUEST
===================================== */

async function acceptRequest(req, res) {
  try {
    const { requestId, mechanic_phone, mechanic_lat, mechanic_lng } = req.body;

    if (!requestId || !mechanic_phone) {
      return res.status(400).json({
        success: false,
        message: "requestId and mechanic_phone required",
      });
    }

    const mechanicPhoneNormalized = normalizePhone(mechanic_phone);

    const allRequests = await getAllServiceRequests();
    const docs = allRequests?.documents || [];

    // Check if mechanic already has active job
    const alreadyActive = docs.find((r) => {
      const reqPhone = normalizePhone(r.mechanic_phone);
      return r.status === "accepted" && reqPhone === mechanicPhoneNormalized;
    });

    if (alreadyActive) {
      return res.status(409).json({
        success: false,
        message: "Mechanic already has an active job",
      });
    }

    const existing = await getServiceRequestById(requestId);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    if (existing.status !== "pending") {
      return res.status(409).json({
        success: false,
        message: "Request already accepted",
      });
    }

    const updated = await updateServiceRequest(requestId, {
      status: "accepted",
      mechanic_phone,
      mechanic_lat: mechanic_lat ?? null,
      mechanic_lng: mechanic_lng ?? null,
      acceptedAt: new Date().toISOString(),
    });

    return res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    console.error("acceptRequest error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

/* =====================================
   UPDATE MECHANIC LOCATION
===================================== */

async function updateMechanicLocation(req, res) {
  try {
    const { requestId, mechanic_lat, mechanic_lng } = req.body;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: "requestId required",
      });
    }

    const updated = await updateServiceRequest(requestId, {
      mechanic_lat,
      mechanic_lng,
    });

    return res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    console.error("updateMechanicLocation error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

/* =====================================
   GET ACTIVE REQUESTS
===================================== */

async function getActiveServiceRequests(req, res) {
  try {
    let { mechanicPhone } = req.query;

    if (!mechanicPhone) {
      return res.status(400).json({
        success: false,
        message: "mechanicPhone required",
      });
    }

    const mechanicPhoneNormalized = normalizePhone(mechanicPhone);

    const result = await getAllServiceRequests();
    const docs = result?.documents || [];

    const filtered = docs.filter((r) => {
      // show all pending requests
      if (r.status === "pending") {
        return true;
      }

      const reqPhone = normalizePhone(r.mechanic_phone);

      // show accepted request only for this mechanic
      if (r.status === "accepted" && reqPhone === mechanicPhoneNormalized) {
        return true;
      }

      return false;
    });

    return res.json({
      success: true,
      requests: filtered,
    });
  } catch (err) {
    console.error("getActiveServiceRequests error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

/* =====================================
   HISTORY
===================================== */

async function userHistory(req, res) {
  const { phone } = req.query;
  const history = await getUserHistory(phone);

  return res.json({
    success: true,
    data: history?.documents || [],
  });
}

async function mechanicHistory(req, res) {
  const { phone } = req.query;
  const history = await getMechanicHistory(phone);

  return res.json({
    success: true,
    data: history?.documents || [],
  });
}

module.exports = {
  createRequest,
  acceptRequest,
  updateMechanicLocation,
  getActiveServiceRequests,
  userHistory,
  mechanicHistory,
};