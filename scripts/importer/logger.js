const fs = require("fs");
const path = require("path");
const CONSTANTS = require("./constants");

let logFile = null;

function initializeLog() {
  if (!fs.existsSync(CONSTANTS.LOGS_DIR)) {
    fs.mkdirSync(CONSTANTS.LOGS_DIR, { recursive: true });
  }

  const now = new Date();

  const fileName =
    now.getFullYear() +
    "-" +
    String(now.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(now.getDate()).padStart(2, "0") +
    "_" +
    String(now.getHours()).padStart(2, "0") +
    "-" +
    String(now.getMinutes()).padStart(2, "0") +
    "-" +
    String(now.getSeconds()).padStart(2, "0") +
    ".log";

  logFile = path.join(CONSTANTS.LOGS_DIR, fileName);
}

function write(message) {
  if (!logFile) return;

  fs.appendFileSync(
    logFile,
    `[${new Date().toLocaleTimeString()}] ${message}\n`
  );
}

function line() {
  console.log(
    "=============================================================="
  );
}

function title(text) {
  console.clear();
  line();
  console.log(text);
  line();

  write(text);
}

function section(text) {
  console.log("");
  console.log("▶ " + text);

  write(text);
}

function info(text) {
  console.log("ℹ " + text);
  write(text);
}

function success(text) {
  console.log("✔ " + text);
  write(text);
}

function warning(text) {
  console.log("⚠ " + text);
  write(text);
}

function error(text) {
  console.log("✖ " + text);
  write(text);
}

module.exports = {
  initializeLog,
  title,
  line,
  section,
  info,
  success,
  warning,
  error,
};