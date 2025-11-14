// src/routes/sessions.js
import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { db } from "../config/firebase.js";

const router = express.Router();

/**
 * @route POST /sessions/create
 * @desc Create a study session
 * @access Private
 */
router.post("/create", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { course, availability, details } = req.body;

    const newSession = {
      uid,
      course,
      availability, // e.g. "Mon 8–10 PM"
      details: details || "",
      createdAt: new Date(),
      active: true, // marks the session as open for matching
    };

    const docRef = await db.collection("sessions").add(newSession);

    res.json({
      message: "Session created successfully",
      sessionId: docRef.id,
      session: newSession,
    });
  } catch (err) {
    console.error("Error creating session:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @route GET /sessions/all
 * @desc Get all study sessions (public)
 * @access Public
 */
router.get("/all", async (_req, res) => {
  try {
    const snapshot = await db.collection("sessions").get();

    const sessions = snapshot.docs.map((doc) => ({
      sessionId: doc.id,
      ...doc.data(),
    }));

    res.json(sessions);
  } catch (err) {
    console.error("Error fetching sessions:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @route GET /sessions/available
 * @desc Get all active (not matched) sessions
 * @access Public
 */
router.get("/available", async (_req, res) => {
  try {
    const snapshot = await db
      .collection("sessions")
      .where("active", "==", true)
      .get();

    const sessions = snapshot.docs.map((doc) => ({
      sessionId: doc.id,
      ...doc.data(),
    }));

    res.json(sessions);
  } catch (err) {
    console.error("Error fetching available sessions:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @route GET /sessions/mine
 * @desc Get sessions created by the logged-in user
 * @access Private
 */
router.get("/mine", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;

    const snapshot = await db
      .collection("sessions")
      .where("uid", "==", uid)
      .get();

    const mySessions = snapshot.docs.map((doc) => ({
      sessionId: doc.id,
      ...doc.data(),
    }));

    res.json(mySessions);
  } catch (err) {
    console.error("Error fetching user sessions:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @route PATCH /sessions/:id
 * @desc Update a session (e.g. close it, update details)
 * @access Private
 */
router.patch("/:id", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const sessionId = req.params.id;

    const sessionRef = db.collection("sessions").doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (sessionDoc.data().uid !== uid) {
      return res.status(403).json({ error: "Not allowed to update this session" });
    }

    await sessionRef.update({
      ...req.body,
      updatedAt: new Date(),
    });

    res.json({ message: "Session updated successfully" });
  } catch (err) {
    console.error("Error updating session:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;