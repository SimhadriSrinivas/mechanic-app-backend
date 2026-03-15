// src/app.js

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

/* ================= SELF PING DEPENDENCIES ================= */
const cron = require("node-cron");

const authRoutes = require("./routes/auth.routes");
const mechanicRoutes = require("./routes/mechanic.routes");
const serviceRoutes = require("./routes/service.routes");

const app = express();
app.disable("etag");

/* =====================================================
   SECURITY MIDDLEWARE
===================================================== */

app.use(helmet());

/* =====================================================
   CORS CONFIG
===================================================== */

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "ngrok-skip-browser-warning",
    ],
  })
);

app.options("*", cors());

/* =====================================================
   BODY PARSER
===================================================== */

app.use(express.json({ limit: "10mb" }));

/* =====================================================
   HEALTH CHECK (FOR MONITORING)
===================================================== */

app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "MEC backend server is running",
    time: new Date(),
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

/* =====================================================
   ROUTES
===================================================== */

app.use("/api/auth", authRoutes);
app.use("/api/mechanic", mechanicRoutes);
app.use("/api/service", serviceRoutes);

/* =====================================================
   SELF PING (OPTIONAL)
===================================================== */

const SERVER_URL =
  process.env.SERVER_URL || "https://mechanic-app-backend-t33m.onrender.com";

/*
Note:
This will NOT prevent Render cold start.
Use UptimeRobot for that.
*/

cron.schedule("*/10 * * * *", async () => {
  try {
    await fetch(`${SERVER_URL}/health`);
    console.log("Self ping successful:", new Date().toISOString());
  } catch (err) {
    console.log("Self ping failed:", err.message);
  }
});

/* =====================================================
   404 HANDLER
===================================================== */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* =====================================================
   GLOBAL ERROR HANDLER
===================================================== */

app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

module.exports = app;