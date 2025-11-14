// env.js
import dotenv from "dotenv";

dotenv.config();

// Validate required env vars
const required = ["PORT", "GOOGLE_APPLICATION_CREDENTIALS"];

required.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

export const env = {
  port: process.env.PORT || 3000,
  serviceAccountPath: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  nodeEnv: process.env.NODE_ENV || "development",
};