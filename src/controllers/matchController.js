// src/controllers/matchController.js
import { db } from "../config/firebase.js";

/**
 * @desc Find potential matches for a specific session
 * @route GET /matches/:sessionId
 * @access Private
 */
export const findMatches = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { sessionId } = req.params;

    const sessionRef = db.collection("sessions").doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      return res.status(404).json({ error: "Session not found" });
    }

    const session = sessionDoc.data();

    // Ensure the requester owns the session
    if (session.creatorUid !== uid) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Get other open sessions for the same course
    const snapshot = await db
      .collection("sessions")
      .where("course", "==", session.course)
      .where("status", "==", "open")
      .get();

    const matches = snapshot.docs
      .map((doc) => ({ sessionId: doc.id, ...doc.data() }))
      .filter((s) => s.creatorUid !== uid); // filter out the user's own session

    res.json(matches);
  } catch (err) {
    console.error("Error finding matches:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @desc Send a match request to another user/session
 * @route POST /matches/request
 * @access Private
 */
export const sendMatchRequest = async (req, res) => {
  try {
    const requesterUid = req.user.uid;
    const { targetSessionId, requesterSessionId } = req.body;

    if (!targetSessionId || !requesterSessionId) {
      return res.status(400).json({ error: "Missing session IDs" });
    }

    const matchRequest = {
      requesterUid,
      requesterSessionId,
      targetSessionId,
      status: "pending", // pending, accepted, rejected
      createdAt: new Date(),
    };

    const ref = await db.collection("matchRequests").add(matchRequest);

    res.json({
      message: "Match request sent",
      requestId: ref.id,
      ...matchRequest,
    });
  } catch (err) {
    console.error("Error sending match request:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @desc Accept a match request → Create chat room + update sessions
 * @route POST /matches/:requestId/accept
 * @access Private
 */
export const acceptMatch = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { requestId } = req.params;

    const requestRef = db.collection("matchRequests").doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      return res.status(404).json({ error: "Match request not found" });
    }

    const request = requestDoc.data();

    // Ensure the user accepting the match owns the target session
    const targetSessionRef = db
      .collection("sessions")
      .doc(request.targetSessionId);
    const targetSessionDoc = await targetSessionRef.get();

    if (!targetSessionDoc.exists) {
      return res.status(404).json({ error: "Target session not found" });
    }

    const targetSession = targetSessionDoc.data();

    if (targetSession.creatorUid !== uid) {
      return res.status(403).json({ error: "Not authorized to accept" });
    }

    // Mark both sessions as matched/closed
    const requesterSessionRef = db
      .collection("sessions")
      .doc(request.requesterSessionId);

    await Promise.all([
      targetSessionRef.update({ status: "matched" }),
      requesterSessionRef.update({ status: "matched" }),
      requestRef.update({ status: "accepted", respondedAt: new Date() }),
    ]);

    // 🚀 Create chat room
    const chatData = {
      members: [uid, request.requesterUid],
      createdAt: new Date(),
      updatedAt: new Date(),
      sessionA: request.requesterSessionId,
      sessionB: request.targetSessionId,
    };

    const chatRef = await db.collection("chats").add(chatData);

    res.json({
      message: "Match accepted",
      chatId: chatRef.id,
      members: chatData.members,
    });
  } catch (err) {
    console.error("Error accepting match:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @desc Reject a match request
 * @route POST /matches/:requestId/reject
 * @access Private
 */
export const rejectMatch = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { requestId } = req.params;

    const requestRef = db.collection("matchRequests").doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      return res.status(404).json({ error: "Match request not found" });
    }

    const request = requestDoc.data();

    // Ensure the user owns the targeted session
    const targetSessionRef = db
      .collection("sessions")
      .doc(request.targetSessionId);
    const targetSessionDoc = await targetSessionRef.get();

    if (!targetSessionDoc.exists) {
      return res.status(404).json({ error: "Target session not found" });
    }

    const targetSession = targetSessionDoc.data();

    if (targetSession.creatorUid !== uid) {
      return res.status(403).json({ error: "Not authorized to reject" });
    }

    await requestRef.update({ status: "rejected", respondedAt: new Date() });

    res.json({ message: "Match rejected" });
  } catch (err) {
    console.error("Error rejecting match:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};