/**
 * scripts/seed.js
 * Usage: node scripts/seed.js
 */

import { db } from "../src/config/firebase.js";
import logger from "../src/utils/logger.js";

// Sample users
const users = [
  {
    uid: "user1",
    name: "Alice Johnson",
    email: "alice@example.com",
    major: "Computer Science",
    studyPreferences: ["quiet", "group"],
    availability: ["Mon 14:00-16:00", "Wed 10:00-12:00"],
  },
  {
    uid: "user2",
    name: "Bob Smith",
    email: "bob@example.com",
    major: "Computer Science",
    studyPreferences: ["group"],
    availability: ["Mon 15:00-17:00", "Thu 09:00-11:00"],
  },
  {
    uid: "user3",
    name: "Charlie Lee",
    email: "charlie@example.com",
    major: "Mathematics",
    studyPreferences: ["quiet"],
    availability: ["Tue 10:00-12:00", "Wed 14:00-16:00"],
  },
];

// Sample study sessions
const sessions = [
  {
    sessionId: "session1",
    creatorUid: "user1",
    course: "CS101",
    availability: ["Mon 14:00-16:00", "Wed 10:00-12:00"],
    participants: ["user1"],
    status: "open",
    notes: "Focus on Chapter 3",
    createdAt: new Date(),
  },
  {
    sessionId: "session2",
    creatorUid: "user2",
    course: "CS101",
    availability: ["Mon 15:00-17:00", "Thu 09:00-11:00"],
    participants: ["user2"],
    status: "open",
    notes: "Review algorithms",
    createdAt: new Date(),
  },
];

// Sample matches (optional)
const matches = [
  {
    matchId: "user1_user2",
    users: ["user1", "user2"],
    score: 70,
    confirmed: false,
    updatedAt: new Date(),
  },
];

const seedFirestore = async () => {
  try {
    logger.info("Seeding users...");
    for (const user of users) {
      await db.collection("users").doc(user.uid).set(user);
      logger.info(`Created user: ${user.name}`);
    }

    logger.info("Seeding study sessions...");
    for (const session of sessions) {
      await db.collection("sessions").doc(session.sessionId).set(session);
      logger.info(`Created session: ${session.sessionId}`);
    }

    logger.info("Seeding matches...");
    for (const match of matches) {
      await db.collection("matches").doc(match.matchId).set(match);
      logger.info(`Created match: ${match.matchId}`);
    }

    logger.info("✅ Seeding completed!");
    process.exit(0);
  } catch (err) {
    logger.error("Seeding failed:", err);
    process.exit(1);
  }
};

// Run the seed
seedFirestore();