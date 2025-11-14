// src/services/chatService.js
import { db } from "../config/firebase.js";

/**
 * Create a new chat room for a matched study group
 * users = array of user IDs
 */
export const createChatRoom = async (users) => {
  const chatRef = db.collection("chats").doc();

  const chatData = {
    users,
    createdAt: new Date(),
  };

  await chatRef.set(chatData);

  return { chatId: chatRef.id, ...chatData };
};

/**
 * Add a message to a chat room
 */
export const sendMessage = async ({ chatId, senderId, text }) => {
  const message = {
    senderId,
    text,
    timestamp: new Date(),
  };

  const messagesRef = db
    .collection("chats")
    .doc(chatId)
    .collection("messages");

  const newMessageRef = await messagesRef.add(message);

  return { messageId: newMessageRef.id, ...message };
};

/**
 * Get all messages in a chat (NOT real-time; controllers handle that)
 */
export const getMessages = async (chatId) => {
  const messagesRef = db
    .collection("chats")
    .doc(chatId)
    .collection("messages")
    .orderBy("timestamp", "asc");

  const snapshot = await messagesRef.get();

  return snapshot.docs.map((doc) => ({
    messageId: doc.id,
    ...doc.data(),
  }));
};

/**
 * Get chats that a specific user is part of
 */
export const getUserChats = async (uid) => {
  const snapshot = await db
    .collection("chats")
    .where("users", "array-contains", uid)
    .get();

  return snapshot.docs.map((doc) => ({
    chatId: doc.id,
    ...doc.data(),
  }));
};

/**
 * Ensure a chat exists between two matched users
 */
export const ensureChatRoom = async (uid1, uid2) => {
  // Check if a chat already exists
  const existingSnap = await db
    .collection("chats")
    .where("users", "array-contains", uid1)
    .get();

  for (const doc of existingSnap.docs) {
    const data = doc.data();
    if (data.users.includes(uid2)) {
      return { chatId: doc.id, ...data };
    }
  }

  // If not found → create new chat
  return await createChatRoom([uid1, uid2]);
};