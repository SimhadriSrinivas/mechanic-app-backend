// src/server.js

const http = require("http");
const app = require("./app");
const config = require("./config");
const { info } = require("./utils/logger");

const PORT = process.env.PORT || config.port || 3000;

const server = http.createServer(app);

server.listen(PORT, () => {
  info(`Server running on port ${PORT}`);
});