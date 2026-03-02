// src/app.js

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

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
   CORS CONFIG (FIXED FOR WEB + NGROK)
===================================================== */

app.use(
  cors({
    origin: "*", // Allow all for development
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "ngrok-skip-browser-warning",
    ],
  })
);

/* Handle preflight explicitly */
app.options("*", cors());

app.use(express.json({ limit: "10mb" }));

/* =====================================================
   HEALTH CHECK
===================================================== */

app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "MEC backend server is running",
  });
});

/* =====================================================
   ROUTES
===================================================== */

app.use("/api/auth", authRoutes);
app.use("/api/mechanic", mechanicRoutes);
app.use("/api/service", serviceRoutes);

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
