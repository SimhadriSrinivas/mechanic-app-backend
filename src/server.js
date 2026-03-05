// src/server.js

const http = require("http");
const app = require("./app");
const config = require("./config");
const { info, error } = require("./utils/logger");

const PORT = process.env.PORT || config.port || 3000;

const server = http.createServer(app);

/* =====================================================
   START SERVER
===================================================== */

server.listen(PORT, () => {
  info(`MEC Backend server running on port ${PORT}`);
});

/* =====================================================
   SERVER ERROR HANDLING
===================================================== */

server.on("error", (err) => {
  error("Server error:", err);
  process.exit(1);
});

/* =====================================================
   UNHANDLED PROMISE REJECTION
===================================================== */

process.on("unhandledRejection", (reason, promise) => {
  error("Unhandled Rejection:", reason);
});

/* =====================================================
   UNCAUGHT EXCEPTION
===================================================== */

process.on("uncaughtException", (err) => {
  error("Uncaught Exception:", err);
});

/* =====================================================
   GRACEFUL SHUTDOWN (Render safe)
===================================================== */

process.on("SIGTERM", () => {
  info("SIGTERM received. Shutting down server...");
  server.close(() => {
    info("Server closed.");
    process.exit(0);
  });
});