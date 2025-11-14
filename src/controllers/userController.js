// src/controllers/userController.js
import { db } from "../config/firebase.js";

/**
 * @desc Get the currently authenticated user's profile
 * @route GET /users/me
 * @access Private
 */
export const getCurrentUser = async (req, res) => {
  try {
    const uid = req.user.uid;

    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

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
};

/**
 * @desc Create a new user (called on first login)
 * @route POST /users
 * @access Private
 */
export const createUser = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { name, major, studyPreferences, photoUrl } = req.body;

    if (!name || !major) {
      return res.status(400).json({ error: "Name and major are required" });
    }

    const userRef = db.collection("users").doc(uid);

    const newUser = {
      name,
      major,
      studyPreferences: studyPreferences || [],
      photoUrl: photoUrl || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await userRef.set(newUser, { merge: true });

    res.json({
      message: "User created successfully",
      uid,
      ...newUser,
    });
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @desc Update user profile
 * @route PUT /users/me
 * @access Private
 */
export const updateUser = async (req, res) => {
  try {
    const uid = req.user.uid;
    const updates = req.body;

    // Add updated timestamp
    updates.updatedAt = new Date();

    const userRef = db.collection("users").doc(uid);
    await userRef.update(updates);

    res.json({
      message: "Profile updated successfully",
      updates,
    });
  } catch (err) {
    console.error("Error updating user:", err);
    if (err.code === 5) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @desc Get another user by UID (support matching & chat features)
 * @route GET /users/:uid
 * @access Private
 */
export const getUserByUid = async (req, res) => {
  try {
    const { uid } = req.params;

    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

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
};