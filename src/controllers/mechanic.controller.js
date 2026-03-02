// src/controllers/mechanic.controller.js
const {
  updateMechanicProfile,
  getMechanicByPhone,
  saveMechanicLogin,
} = require("../services/appwrite.service");

const { encryptAadhaar } = require("../utils/crypto");
/* ================= PHONE NORMALIZER ================= */
function normalizePhone(phone) {
  if (!phone) return phone;

  // remove spaces, +, dashes
  let cleaned = phone.replace(/\D/g, "");

  // remove leading 91 if present (India country code)
  if (cleaned.startsWith("91") && cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  }

  return cleaned;
}

/* =====================================
   GET MECHANIC PROFILE
===================================== */
async function getMechanicProfile(req, res) {
  try {
    let { phone } = req.query;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "phone is required",
      });
    }

    phone = normalizePhone(phone);

    const mechanic = await getMechanicByPhone(phone);

    if (!mechanic) {
      return res.status(404).json({
        success: false,
        message: "Mechanic not found",
      });
    }

    return res.json({
      success: true,
      data: {
        name: mechanic.Name || "",
        phone: mechanic.Mobile_Number,
        rating: mechanic.rating ?? 4.5,
        service: mechanic.TypeOfService || "",
        address: mechanic.Address || "",
        state: mechanic.state || "OffDuty",
      },
    });
  } catch (err) {
    console.error("getMechanicProfile error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

/* =====================================
   UPDATE MECHANIC PROFILE (EDIT)
===================================== */
async function updateMechanicProfileController(req, res) {
  try {
    let { phone, name, service, address } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "phone is required",
      });
    }
    phone = normalizePhone(phone);
    const updateData = {};
    if (name) updateData.Name = name;
    if (service) updateData.TypeOfService = service;
    if (address) updateData.Address = address;
    const updated = await updateMechanicProfile(phone, updateData);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Mechanic not found",
      });
    }
    return res.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (err) {
    console.error("updateMechanicProfileController error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
/* =====================================
   GET NEARBY MECHANICS (ROLE BASED)
===================================== */
async function getNearbyMechanics(req, res) {
  try {
    const { lat, lng, role, radius = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "lat and lng are required",
      });
    }

    const userLat = Number(lat);
    const userLng = Number(lng);
    const maxDistance = Number(radius);

    if (isNaN(userLat) || isNaN(userLng)) {
      return res.status(400).json({
        success: false,
        message: "Invalid latitude or longitude",
      });
    }

    const { getAllMechanics } = require("../services/appwrite.service");
    const result = await getAllMechanics();
    const mechanics = result?.documents || [];

    // ================= Haversine Formula =================
    function getDistance(lat1, lon1, lat2, lon2) {
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;

      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }

    const filtered = mechanics.filter((m) => {
      if (m.state !== "OnDuty") return false;
      if (!m.latitude || !m.longitude) return false;

      const mechanicLat = Number(m.latitude);
      const mechanicLng = Number(m.longitude);

      if (isNaN(mechanicLat) || isNaN(mechanicLng)) return false;

      const distance = getDistance(
        userLat,
        userLng,
        mechanicLat,
        mechanicLng
      );

      if (distance > maxDistance) return false;

      // 🔥 ROLE FILTER (NEW)
      if (role && m.Role) {
        const mechanicRoles = m.Role.toLowerCase();

        if (!mechanicRoles.includes(role.toLowerCase())) {
          return false;
        }
      }

      return true;
    });

    const responseData = filtered.map((m) => ({
      phone: m.Mobile_Number,
      name: m.Name,
      latitude: Number(m.latitude),
      longitude: Number(m.longitude),
      role: m.Role,
    }));

    return res.json({
      success: true,
      count: responseData.length,
      mechanics: responseData,
    });
  } catch (err) {
    console.error("getNearbyMechanics error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
/* =====================================
   REGISTER MECHANIC (INITIAL)
===================================== */
async function registerMechanic(req, res) {
  try {
    let {
      firstName,
      lastName,
      phone,
      serviceTypes,
      roles,
      vehicleTypes,
      address,
      aadhaar,
      latitude,
      longitude,
    } = req.body;
    if (
      !firstName ||
      !lastName ||
      !phone ||
      !Array.isArray(serviceTypes) ||
      serviceTypes.length === 0 ||
      !address ||
      !aadhaar
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing or invalid required fields",
      });
    }
    if (aadhaar.length !== 12) {
      return res.status(400).json({
        success: false,
        message: "Aadhaar must be 12 digits",
      });
    }
    phone = normalizePhone(phone);
    const aadhaarEncrypted = encryptAadhaar(aadhaar);
    const updateData = {
      Name: `${firstName} ${lastName}`,
      TypeOfService: serviceTypes.join(", "),
      Role: Array.isArray(roles) ? roles.join(", ") : "",
      TypeOfVehicle: Array.isArray(vehicleTypes) ? vehicleTypes.join(", ") : "",
      Address: address,
      Aadhaar_Number: aadhaarEncrypted,
      latitude: Number(latitude),
      longitude: Number(longitude),
      profile_completed: true,
      state: "OffDuty",
    };
    const updated = await updateMechanicProfile(phone, updateData);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Mechanic not found. Login again.",
      });
    }
    return res.json({
      success: true,
      message: "Mechanic profile registered successfully",
    });
  } catch (err) {
    console.error("registerMechanic error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
/* =====================================
   UPDATE DUTY STATUS
===================================== */
async function updateDutyStatus(req, res) {
  try {
    let { phone, state } = req.body;
    if (!phone || !state) {
      return res.status(400).json({
        success: false,
        message: "phone and state are required",
      });
    }
    if (!["OnDuty", "OffDuty"].includes(state)) {
      return res.status(400).json({
        success: false,
        message: "Invalid state value",
      });
    }
    phone = normalizePhone(phone);
    // Ensure mechanic exists
    let mechanic = await getMechanicByPhone(phone);
    if (!mechanic) {
      mechanic = await saveMechanicLogin(phone);
      if (!mechanic) {
        return res.status(500).json({
          success: false,
          message: "Failed to create mechanic profile",
        });
      }
    }
    const updated = await updateMechanicProfile(phone, {
      state,
    });
    if (!updated) {
      return res.status(500).json({
        success: false,
        message: "Failed to update duty status",
      });
    }
    return res.json({
      success: true,
      message: `Mechanic is now ${state}`,
    });
  } catch (err) {
    console.error("updateDutyStatus error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
module.exports = {
  registerMechanic,
  getMechanicProfile,
  updateMechanicProfileController,
  getNearbyMechanics,
  updateDutyStatus,
};
