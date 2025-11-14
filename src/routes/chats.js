// src/routes/chats.js
import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { db } from "../config/firebase.js";

const router = express.Router();

/**
 * @route GET /chats
 * @desc Get all chat rooms the user is part of
 * @access Private
 */
router.get("/", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;

    const snapshot = await db
      .collection("chats")
      .where("members", "array-contains", uid)
      .get();

    const chats = snapshot.docs.map((doc) => ({
      chatId: doc.id,
      ...doc.data(),
    }));

    res.json(chats);
  } catch (err) {
    console.error("Error fetching chats:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @route GET /chats/:chatId/messages
 * @desc Get message history for a chat room (sorted by time)
 * @access Private
 */
router.get("/:chatId/messages", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { chatId } = req.params;

    const chatRef = db.collection("chats").doc(chatId);
    const chatDoc = await chatRef.get();

    if (!chatDoc.exists) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const chatData = chatDoc.data();

    // Ensure the user is a member
    if (!chatData.members.includes(uid)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const snapshot = await chatRef
      .collection("messages")
      .orderBy("timestamp", "asc")
      .get();

    const messages = snapshot.docs.map((doc) => ({
      messageId: doc.id,
      ...doc.data(),
    }));

    res.json(messages);
  } catch (err) {
    console.error("Error getting messages:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @route POST /chats/:chatId/messages
 * @desc Send a new message to a chat room
 * @access Private
 */
router.post("/:chatId/messages", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { chatId } = req.params;
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Message text is required" });
    }

    const chatRef = db.collection("chats").doc(chatId);
    const chatDoc = await chatRef.get();

    if (!chatDoc.exists) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const chatData = chatDoc.data();

    // Ensure the user is a member
    if (!chatData.members.includes(uid)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const newMessage = {
      senderUid: uid,
      text,
      timestamp: new Date(),
    };

    const msgRef = await chatRef.collection("messages").add(newMessage);

    res.json({
      message: "Message sent",
      messageId: msgRef.id,
      ...newMessage,
    });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @route DELETE /chats/:chatId
 * @desc Leave a chat room (soft leave)
 * @access Private
 */
router.delete("/:chatId", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { chatId } = req.params;

    const chatRef = db.collection("chats").doc(chatId);
    const chatDoc = await chatRef.get();

    if (!chatDoc.exists) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const chatData = chatDoc.data();

    if (!chatData.members.includes(uid)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Remove the user from members
    const updatedMembers = chatData.members.filter((m) => m !== uid);

    await chatRef.update({
      members: updatedMembers,
      updatedAt: new Date(),
    });

    res.json({ message: "Left chat successfully" });
  } catch (err) {
    console.error("Error leaving chat:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;