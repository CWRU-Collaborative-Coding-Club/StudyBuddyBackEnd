// src/routes/matches.js
import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { db } from "../config/firebase.js";

const router = express.Router();

/**
 * @route GET /matches/find
 * @desc Find potential matches based on course + availability
 * @access Private
 */
router.get("/find", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { course, availability } = req.query;

    if (!course || !availability) {
      return res.status(400).json({ error: "Missing course or availability" });
    }

    // Query for active sessions matching course + availability
    const snapshot = await db
      .collection("sessions")
      .where("course", "==", course)
      .where("availability", "==", availability)
      .where("active", "==", true)
      .get();

    const potentialMatches = snapshot.docs
      .map((doc) => ({
        sessionId: doc.id,
        ...doc.data(),
      }))
      .filter((session) => session.uid !== uid); // exclude yourself

    res.json(potentialMatches);
  } catch (err) {
    console.error("Error finding matches:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @route POST /matches/request
 * @desc Send a match request to another user
 * @access Private
 */
router.post("/request", verifyToken, async (req, res) => {
  try {
    const senderUid = req.user.uid;
    const { targetUid, sessionId } = req.body;

    if (!targetUid || !sessionId) {
      return res.status(400).json({ error: "Missing targetUid or sessionId" });
    }

    const matchRequest = {
      senderUid,
      targetUid,
      sessionId,
      status: "pending",
      createdAt: new Date(),
    };

    const ref = await db.collection("matches").add(matchRequest);

    res.json({
      message: "Match request sent",
      matchId: ref.id,
      match: matchRequest,
    });
  } catch (err) {
    console.error("Error sending match request:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @route GET /matches/requests
 * @desc Get your incoming match requests
 * @access Private
 */
router.get("/requests", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;

    const snapshot = await db
      .collection("matches")
      .where("targetUid", "==", uid)
      .where("status", "==", "pending")
      .get();

    const requests = snapshot.docs.map((doc) => ({
      matchId: doc.id,
      ...doc.data(),
    }));

    res.json(requests);
  } catch (err) {
    console.error("Error getting match requests:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @route POST /matches/respond
 * @desc Accept or decline a match request
 * @access Private
 */
router.post("/respond", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { matchId, action } = req.body;

    if (!matchId || !action || !["accept", "decline"].includes(action)) {
      return res.status(400).json({ error: "Invalid match response" });
    }

    const matchRef = db.collection("matches").doc(matchId);
    const matchDoc = await matchRef.get();

    if (!matchDoc.exists) {
      return res.status(404).json({ error: "Match request not found" });
    }

    const matchData = matchDoc.data();

    if (matchData.targetUid !== uid) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // If declined → simply update
    if (action === "decline") {
      await matchRef.update({
        status: "declined",
        updatedAt: new Date(),
      });
      return res.json({ message: "Match declined" });
    }

    // If accepted → create chat room + deactivate session
    await matchRef.update({
      status: "accepted",
      updatedAt: new Date(),
    });

    // 1️⃣ Mark session inactive
    await db.collection("sessions").doc(matchData.sessionId).update({
      active: false,
    });

    // 2️⃣ Create chat room for the new group
    const chatRoom = await db.collection("chats").add({
      members: [matchData.senderUid, matchData.targetUid],
      createdAt: new Date(),
      sessionId: matchData.sessionId,
    });

    res.json({
      message: "Match accepted",
      chatRoomId: chatRoom.id,
    });
  } catch (err) {
    console.error("Error responding to match:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;