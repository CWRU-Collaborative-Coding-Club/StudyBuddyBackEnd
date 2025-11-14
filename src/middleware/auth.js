// auth.js
import { auth } from "../config/firebase.js";

export const verifyToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid token" });
    }

    const idToken = authHeader.split(" ")[1];

    // Verify token with Firebase Admin
    const decoded = await auth.verifyIdToken(idToken);

    // Attach user info for route handlers (uid, email, etc.)
    req.user = decoded;

    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    res.status(401).json({ error: "Unauthorized" });
  }
};