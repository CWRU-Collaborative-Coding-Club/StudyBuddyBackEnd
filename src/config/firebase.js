// firebase.js
import admin from "firebase-admin";
import dotenv from "dotenv";
import { readFileSync } from "fs";

dotenv.config();

// Prevent multiple initializations in dev mode (nodemon)
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8")
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const auth = admin.auth();

export { admin, db, auth };