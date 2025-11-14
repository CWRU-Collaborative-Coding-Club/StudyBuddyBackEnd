import admin from "../config/firebase.js";
import responseHelper from "./responseHelper.js";
import logger from "./logger.js";

/**
 * Middleware to verify Firebase ID Token
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return responseHelper.sendError(res, "Unauthorized: No token provided", 401);
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
    next();
  } catch (err) {
    logger.error("Token verification failed:", err);
    return responseHelper.sendError(res, "Unauthorized: Invalid token", 401);
  }
};

export default verifyToken;