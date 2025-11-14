import admin from "../config/firebase.js"; // Firebase Admin SDK
import responseHelper from "../utils/responseHelper.js";
import logger from "../utils/logger.js";

/**
 * Sign up a new user
 */
export const signUp = async (req, res) => {
  const { email, password, name, major, studyPreferences } = req.body;

  try {
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    // Store additional user info in Firestore
    await admin.firestore().collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      name,
      email,
      major: major || "",
      studyPreferences: studyPreferences || [],
      createdAt: new Date(),
    });

    return responseHelper.sendSuccess(
      res,
      { uid: userRecord.uid, email, name, major, studyPreferences },
      "User created successfully",
      201
    );
  } catch (err) {
    logger.error("SignUp Error:", err);
    return responseHelper.sendError(res, err.message, 400);
  }
};

/**
 * Log in a user
 * 
 * Note: In Firebase Auth, login is usually handled on the client side.
 * This endpoint can verify the ID token sent from the client.
 */
export const login = async (req, res) => {
  const { idToken } = req.body;

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(decodedToken.uid)
      .get();

    if (!userDoc.exists) {
      return responseHelper.sendError(res, "User not found", 404);
    }

    return responseHelper.sendSuccess(
      res,
      { uid: decodedToken.uid, ...userDoc.data() },
      "Login successful"
    );
  } catch (err) {
    logger.error("Login Error:", err);
    return responseHelper.sendError(res, "Invalid token", 401);
  }
};

/**
 * Log out a user
 * 
 * Note: With Firebase Auth, logout is typically handled on the client.
 * You can also revoke refresh tokens here if you want server-side logout:
 */
export const logout = async (req, res) => {
  try {
    const uid = req.user.uid;

    await admin.auth().revokeRefreshTokens(uid);

    return responseHelper.sendSuccess(res, {}, "User logged out successfully");
  } catch (err) {
    logger.error("Logout Error:", err);
    return responseHelper.sendError(res, "Logout failed", 500);
  }
};

/**
 * Verify Firebase ID token middleware
 */
export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return responseHelper.sendError(res, "Unauthorized", 401);
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = { uid: decodedToken.uid, email: decodedToken.email };
    next();
  } catch (err) {
    logger.error("Token verification failed:", err);
    return responseHelper.sendError(res, "Unauthorized", 401);
  }
};