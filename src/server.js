// src/server.js
import express from "express";
import dotenv from "dotenv";
import admin from "firebase-admin";
import cors from "cors";
import { readFileSync } from "fs";
import userRoutes from "./routes/userRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";

// Load environment variables
dotenv.config();

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Initialize Express
const app = express();
app.use(express.json());
app.use(cors());

// Attach Firestore globally
app.locals.db = db;

// --- Test
