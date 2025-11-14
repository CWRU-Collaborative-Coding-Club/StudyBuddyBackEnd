/**
 * Simple logger utility
 * Usage:
 * import logger from "../utils/logger.js";
 * logger.info("Server started");
 * logger.error("Something went wrong");
 */

const isProduction = process.env.NODE_ENV === "production";

const timestamp = () => new Date().toISOString();

const log = (level, ...args) => {
  if (!isProduction || level === "error") {
    console[level](`[${timestamp()}] [${level.toUpperCase()}]:`, ...args);
  }
};

const logger = {
  info: (...args) => log("log", ...args),
  warn: (...args) => log("warn", ...args),
  error: (...args) => log("error", ...args),
  debug: (...args) => {
    if (!isProduction) log("log", "[DEBUG]", ...args);
  },
};

export default logger;