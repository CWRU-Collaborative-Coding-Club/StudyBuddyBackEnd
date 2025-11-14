// src/routes/users.js
import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { db } from "../config/firebase.js";

const router = express.Router();

/**
 * @route GET /users/me
 * @desc Get the currently authenticated user's profile
 * @access Private
 */
router.get("/me", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;

    const userDoc = await db.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User profile not found" });
    }

    res.json({
      uid,
      ...userDoc.data(),
    });
  } catch (err) {
    console.error("Error getting user profile:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @route POST /users/create
 * @desc Create or update the authenticated user's profile
 * @access Private
 */
router.post("/create", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { name, major, studyPreferences } = req.body;

    const userData = {
      name: name || "",
      major: major || "",
      studyPreferences: studyPreferences || [],
      updatedAt: new Date(),
    };

    await db.collection("users").doc(uid).set(userData, { merge: true });

    res.json({
      message: "User profile saved successfully",
      user: { uid, ...userData },
    });
  } catch (err) {
    console.error("Error saving user profile:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @route GET /users/:uid
 * @desc Get public info for any user (NOT protected)
 * @access Public
 */
router.get("/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const userDoc = await db.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      uid,
      ...userDoc.data(),
    });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;