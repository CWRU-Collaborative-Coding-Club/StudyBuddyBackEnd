// src/app.js
import express from "express";
import cors from "cors";
import admin from "firebase-admin";

import userRoutes from "./routes/userRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Attach Firestore so all routes can access it
app.locals.db = admin.firestore();

// Health route
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend is running",
    time: new Date().toISOString(),
  });
});

// Register routes
app.use("/users", userRoutes);
app.use("/sessions", sessionRoutes);

export default app;