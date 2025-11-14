import express from "express";
import {
  signUp,
  login,
  logout,
} from "../controllers/authController.js";
import verifyToken from "../utils/verifyToken.js";

const router = express.Router();

/**
 * @route POST /api/auth/signup
 * @desc Register a new user
 * @access Public
 */
router.post("/signup", signUp);

/**
 * @route POST /api/auth/login
 * @desc Verify Firebase ID token sent from client
 * @access Public
 */
router.post("/login", login);

/**
 * @route POST /api/auth/logout
 * @desc Log out a user by revoking refresh tokens
 * @access Private
 */
router.post("/logout", verifyToken, logout);

export default router;