// src/services/matchService.js
import { db } from "../config/firebase.js";

/**
 * Generates a match score between two users based on shared preferences.
 * You can expand this later with better scoring (ML, weighting, etc.)
 */
export const calculateMatchScore = (userA, userB) => {
  let score = 0;

  // Matching major
  if (userA.major === userB.major) score += 30;

  // Matching study preferences
  const sharedPrefs = userA.studyPreferences.filter((pref) =>
    userB.studyPreferences.includes(pref)
  );
  score += sharedPrefs.length * 10;

  // Availability overlap (if implemented)
  if (userA.availability && userB.availability) {
    const overlap = userA.availability.some((slot) =>
      userB.availability.includes(slot)
    );
    if (overlap) score += 20;
  }

  return Math.min(score, 100); // keep score in 0–100 range
};

/**
 * Fetch user from Firestore
 */
export const fetchUser = async (uid) => {
  const userDoc = await db.collection("users").doc(uid).get();
  if (!userDoc.exists) return null;
  return { uid, ...userDoc.data() };
};

/**
 * Create or update match entry in Firestore
 */
export const saveMatch = async (userA, userB, score) => {
  const matchId = userA.uid < userB.uid ? `${userA.uid}_${userB.uid}` : `${userB.uid}_${userA.uid}`;

  const matchRef = db.collection("matches").doc(matchId);

  await matchRef.set(
    {
      users: [userA.uid, userB.uid],
      score,
      updatedAt: new Date(),
    },
    { merge: true }
  );

  return { matchId, score };
};

/**
 * Generate match suggestions for a user
 */
export const generateRecommendations = async (uid) => {
  const user = await fetchUser(uid);
  if (!user) return [];

  // Get all other users
  const usersSnap = await db.collection("users").get();

  const otherUsers = usersSnap.docs
    .map((doc) => ({ uid: doc.id, ...doc.data() }))
    .filter((u) => u.uid !== uid);

  const results = [];

  for (const target of otherUsers) {
    const score = calculateMatchScore(user, target);
    if (score > 0) {
      const match = await saveMatch(user, target, score);
      results.push({
        ...match,
        user: target,
      });
    }
  }

  // Sort descending by score
  return results.sort((a, b) => b.score - a.score);
};

/**
 * Confirm a mutual match (both users accept)
 */
export const confirmMatch = async (uid1, uid2) => {
  const matchId = uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;

  const matchRef = db.collection("matches").doc(matchId);
  const matchDoc = await matchRef.get();

  if (!matchDoc.exists) {
    return { error: "Match does not exist" };
  }

  const matchData = matchDoc.data();

  // Update to a confirmed match
  await matchRef.update({
    confirmed: true,
    confirmedAt: new Date(),
  });

  return { matchId, ...matchData, confirmed: true };
};