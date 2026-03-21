// src/services/appwrite.service.js

const { Client, Databases, Query, ID } = require("node-appwrite");
const config = require("../config");
const { info, error } = require("../utils/logger");

let client = null;
let databases = null;

/* ====================================================
   APPWRITE CLIENT INITIALIZATION
==================================================== */

try {
  if (
    config.appwrite.endpoint &&
    config.appwrite.projectId &&
    config.appwrite.apiKey
  ) {
    client = new Client()
      .setEndpoint(config.appwrite.endpoint)
      .setProject(config.appwrite.projectId)
      .setKey(config.appwrite.apiKey);

    databases = new Databases(client);

    info("✅ Appwrite connected");
  } else {
    error("❌ Appwrite configuration missing");
  }
} catch (err) {
  error("❌ Failed to initialize Appwrite:", err.message);
}

/* ====================================================
   SAFETY CHECK
==================================================== */

function ensureDatabase() {
  if (!databases) {
    error("❌ Database not initialized");
    return false;
  }
  return true;
}

/* ====================================================
   USER LOGIN
==================================================== */

async function saveUserLogin(phone) {
  if (!ensureDatabase()) return null;

  try {
    const existing = await databases.listDocuments(
      config.appwrite.databaseId,
      config.appwrite.otpCollectionId,
      [Query.equal("phone", phone)],
    );

    if (existing.total > 0) return existing.documents[0];

    return await databases.createDocument(
      config.appwrite.databaseId,
      config.appwrite.otpCollectionId,
      ID.unique(),
      { phone, tries: 0 },
    );
  } catch (err) {
    error("saveUserLogin:", err.message);
    return null;
  }
}

/* ====================================================
   MECHANIC PROFILE
==================================================== */

async function getMechanicByPhone(phone) {
  if (!ensureDatabase()) return null;

  try {
    const res = await databases.listDocuments(
      config.appwrite.databaseId,
      config.appwrite.mechanicCollectionId,
      [Query.equal("Mobile_Number", phone)],
    );

    return res.total > 0 ? res.documents[0] : null;
  } catch (err) {
    error("getMechanicByPhone:", err.message);
    return null;
  }
}

async function saveMechanicLogin(phone) {
  if (!ensureDatabase()) return null;

  try {
    const existing = await getMechanicByPhone(phone);
    if (existing) return existing;

    return await databases.createDocument(
      config.appwrite.databaseId,
      config.appwrite.mechanicCollectionId,
      ID.unique(),
      {
        Mobile_Number: phone,
        profile_completed: false,
        state: "OffDuty",
      },
    );
  } catch (err) {
    error("saveMechanicLogin:", err.message);
    return null;
  }
}

async function updateMechanicProfile(phone, data) {
  if (!ensureDatabase()) return null;

  try {
    const mechanic = await getMechanicByPhone(phone);
    if (!mechanic) return null;

    const allowedFields = {
      Name: data.Name,
      Address: data.Address,
      TypeOfService: data.TypeOfService,
      TypeOfVehicle: data.TypeOfVehicle,
      Role: data.Role,
      latitude: data.latitude,
      longitude: data.longitude,
      Aadhaar_Number: data.Aadhaar_Number,
      state: data.state,
      profile_completed: data.profile_completed,
    };

    Object.keys(allowedFields).forEach(
      (key) => allowedFields[key] === undefined && delete allowedFields[key],
    );

    return await databases.updateDocument(
      config.appwrite.databaseId,
      config.appwrite.mechanicCollectionId,
      mechanic.$id,
      allowedFields,
    );
  } catch (err) {
    error("updateMechanicProfile:", err.message);
    return null;
  }
}

/* ====================================================
   GET ALL MECHANICS
==================================================== */

async function getAllMechanics() {
  if (!ensureDatabase()) return { documents: [] };

  try {
    return await databases.listDocuments(
      config.appwrite.databaseId,
      config.appwrite.mechanicCollectionId,
      [
        Query.equal("profile_completed", true),
        Query.equal("state", "OnDuty"),
        Query.orderDesc("$updatedAt"),
        Query.limit(500),
      ],
    );
  } catch (err) {
    error("getAllMechanics:", err.message);
    return { documents: [] };
  }
}

/* ====================================================
   SERVICE REQUESTS
==================================================== */

async function createServiceRequest(data) {
  if (!ensureDatabase()) return null;

  try {
    return await databases.createDocument(
      config.appwrite.databaseId,
      config.appwrite.serviceRequestCollectionId,
      ID.unique(),
      data,
    );
  } catch (err) {
    error("createServiceRequest:", err.message);
    return null;
  }
}

async function getAllServiceRequests() {
  if (!ensureDatabase()) return { documents: [] };

  try {
    return await databases.listDocuments(
      config.appwrite.databaseId,
      config.appwrite.serviceRequestCollectionId,
      [Query.orderDesc("$createdAt"), Query.limit(100)],
    );
  } catch (err) {
    error("getAllServiceRequests:", err.message);
    return { documents: [] };
  }
}

async function getServiceRequestById(requestId) {
  if (!ensureDatabase()) return null;

  try {
    return await databases.getDocument(
      config.appwrite.databaseId,
      config.appwrite.serviceRequestCollectionId,
      requestId,
    );
  } catch (err) {
    error("getServiceRequestById:", err.message);
    return null;
  }
}

async function updateServiceRequest(requestId, data) {
  if (!ensureDatabase()) return null;

  try {
    return await databases.updateDocument(
      config.appwrite.databaseId,
      config.appwrite.serviceRequestCollectionId,
      requestId,
      data,
    );
  } catch (err) {
    error("updateServiceRequest:", err.message);
    return null;
  }
}

async function getUserHistory(phone) {
  if (!ensureDatabase()) return { documents: [] };

  try {
    return await databases.listDocuments(
      config.appwrite.databaseId,
      config.appwrite.serviceRequestCollectionId,
      [
        Query.equal("user_phone", phone),
        Query.orderDesc("$createdAt"),
        Query.limit(100),
      ],
    );
  } catch (err) {
    error("getUserHistory:", err.message);
    return { documents: [] };
  }
}

// ONLY THIS FUNCTION CHANGED 👇👇👇

async function getMechanicHistory(phone) {
  if (!ensureDatabase()) return { documents: [] };

  try {
    if (!phone) return { documents: [] };

    const clean = phone.replace(/\D/g, "");

    const formats = [];

    if (clean.length === 10) {
      formats.push(clean);
      formats.push(`91${clean}`);
      formats.push(`+91${clean}`);
    } else if (clean.length === 12) {
      formats.push(clean);
      formats.push(`+${clean}`);
      formats.push(clean.slice(2));
    } else {
      formats.push(phone);
    }

    console.log(" Searching mechanic_phone formats:", formats);

    return await databases.listDocuments(
      config.appwrite.databaseId,
      config.appwrite.serviceRequestCollectionId,
      [
        Query.or(
          formats.map((p) => Query.equal("mechanic_phone", p))
        ),
        Query.equal("status", "completed"),
        Query.orderDesc("$createdAt"),
        Query.limit(100),
      ]
    );
  } catch (err) {
    error("getMechanicHistory:", err.message);
    return { documents: [] };
  }
}
/* ====================================================
   EXPORTS
==================================================== */

module.exports = {
  saveUserLogin,
  saveMechanicLogin,
  getMechanicByPhone,
  updateMechanicProfile,
  createServiceRequest,
  getAllServiceRequests,
  getServiceRequestById,
  updateServiceRequest,
  getAllMechanics,
  getUserHistory,
  getMechanicHistory,
};