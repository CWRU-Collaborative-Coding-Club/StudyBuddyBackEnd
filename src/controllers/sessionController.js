// src/controllers/sessionController.js
import { db } from "../config/firebase.js";

/**
 * @desc Create a new study session
 * @route POST /sessions
 * @access Private
 */
export const createSession = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { course, availability, notes } = req.body;

    if (!course || !availability) {
      return res.status(400).json({ error: "course and availability are required" });
    }

    const newSession = {
      creatorUid: uid,
      course,
      availability,
      notes: notes || "",
      createdAt: new Date(),
      participants: [uid],
      status: "open", // open, matched, closed
    };

    const sessionRef = await db.collection("sessions").add(newSession);

    res.json({
      message: "Study session created",
      sessionId: sessionRef.id,
      ...newSession,
    });
  } catch (err) {
    console.error("Error creating session:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @desc Get all available (open) study sessions
 * @route GET /sessions
 * @access Private
 */
export const getAllSessions = async (req, res) => {
  try {
    const snapshot = await db
      .collection("sessions")
      .where("status", "==", "open")
      .orderBy("createdAt", "desc")
      .get();

    const sessions = snapshot.docs.map((doc) => ({
      sessionId: doc.id,
      ...doc.data(),
    }));

    res.json(sessions);
  } catch (err) {
    console.error("Error fetching sessions:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @desc Get all sessions created by the user
 * @route GET /sessions/me
 * @access Private
 */
export const getMySessions = async (req, res) => {
  try {
    const uid = req.user.uid;

    const snapshot = await db
      .collection("sessions")
      .where("creatorUid", "==", uid)
      .orderBy("createdAt", "desc")
      .get();

    const sessions = snapshot.docs.map((doc) => ({
      sessionId: doc.id,
      ...doc.data(),
    }));

    res.json(sessions);
  } catch (err) {
    console.error("Error fetching user sessions:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @desc Join an existing study session
 * @route POST /sessions/:sessionId/join
 * @access Private
 */
export const joinSession = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { sessionId } = req.params;

    const sessionRef = db.collection("sessions").doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      return res.status(404).json({ error: "Session not found" });
    }

    const session = sessionDoc.data();

    if (session.status !== "open") {
      return res.status(400).json({ error: "Session is not open" });
    }

    if (session.participants.includes(uid)) {
      return res.status(400).json({ error: "Already joined this session" });
    }

    const updatedParticipants = [...session.participants, uid];

    await sessionRef.update({
      participants: updatedParticipants,
      updatedAt: new Date(),
    });

    res.json({
      message: "Joined session",
      sessionId,
      participants: updatedParticipants,
    });
  } catch (err) {
    console.error("Error joining session:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @desc Delete a session (only creator can delete)
 * @route DELETE /sessions/:sessionId
 * @access Private
 */
export const deleteSession = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { sessionId } = req.params;

    const sessionRef = db.collection("sessions").doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      return res.status(404).json({ error: "Session not found" });
    }

    const session = sessionDoc.data();

    if (session.creatorUid !== uid) {
      return res.status(403).json({ error: "Not authorized to delete this session" });
    }

    await sessionRef.delete();

    res.json({ message: "Session deleted successfully" });
  } catch (err) {
    console.error("Error deleting session:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};