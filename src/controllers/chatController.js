// src/controllers/chatController.js
import { db } from "../config/firebase.js";

/**
 * @desc Get all chats the current user is part of
 * @route GET /chats
 * @access Private
 */
export const getMyChats = async (req, res) => {
  try {
    const uid = req.user.uid;

    const snapshot = await db
      .collection("chats")
      .where("members", "array-contains", uid)
      .orderBy("updatedAt", "desc")
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
};

/**
 * @desc Get past messages for a chat room
 * @route GET /chats/:chatId/messages
 * @access Private
 */
export const getMessages = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { chatId } = req.params;

    const chatRef = db.collection("chats").doc(chatId);
    const chatDoc = await chatRef.get();

    if (!chatDoc.exists) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const chat = chatDoc.data();

    if (!chat.members.includes(uid)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const messagesSnapshot = await chatRef
      .collection("messages")
      .orderBy("timestamp", "asc")
      .get();

    const messages = messagesSnapshot.docs.map((doc) => ({
      messageId: doc.id,
      ...doc.data(),
    }));

    res.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @desc Send a message inside a chat room
 * @route POST /chats/:chatId/messages
 * @access Private
 */
export const sendMessage = async (req, res) => {
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

    const chat = chatDoc.data();

    if (!chat.members.includes(uid)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const message = {
      senderUid: uid,
      text,
      timestamp: new Date(),
    };

    const msgRef = await chatRef.collection("messages").add(message);

    // Update chat's updatedAt timestamp for sorting
    await chatRef.update({
      updatedAt: new Date(),
    });

    res.json({
      message: "Message sent",
      messageId: msgRef.id,
      ...message,
    });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @desc Leave a chat room
 * @route DELETE /chats/:chatId
 * @access Private
 */
export const leaveChat = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { chatId } = req.params;

    const chatRef = db.collection("chats").doc(chatId);
    const chatDoc = await chatRef.get();

    if (!chatDoc.exists) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const chat = chatDoc.data();

    if (!chat.members.includes(uid)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const updatedMembers = chat.members.filter((m) => m !== uid);

    await chatRef.update({
      members: updatedMembers,
      updatedAt: new Date(),
    });

    res.json({
      message: "Left chat successfully",
      chatId,
      members: updatedMembers,
    });
  } catch (err) {
    console.error("Error leaving chat:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};