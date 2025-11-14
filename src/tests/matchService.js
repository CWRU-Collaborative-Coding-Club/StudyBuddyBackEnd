import {
  calculateMatchScore,
  saveMatch,
  generateRecommendations,
} from "../src/services/matchService.js";

// Mock Firestore
jest.mock("../src/config/firebase.js", () => {
  return {
    db: {
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          set: jest.fn(() => Promise.resolve()),
          get: jest.fn(() =>
            Promise.resolve({ exists: true, data: () => ({ uid: "userB", major: "CS", studyPreferences: ["quiet"] }) })
          ),
        })),
        get: jest.fn(() =>
          Promise.resolve({
            docs: [
              { id: "userB", data: () => ({ uid: "userB", major: "CS", studyPreferences: ["quiet"] }) },
            ],
          })
        ),
      })),
    },
  };
});

describe("matchService", () => {
  describe("calculateMatchScore", () => {
    it("should return 0 for completely different users", () => {
      const userA = { major: "Math", studyPreferences: ["group"], availability: ["Mon 10:00-12:00"] };
      const userB = { major: "CS", studyPreferences: ["quiet"], availability: ["Tue 14:00-16:00"] };

      const score = calculateMatchScore(userA, userB);
      expect(score).toBe(0);
    });

    it("should return a positive score for similar users", () => {
      const userA = { major: "CS", studyPreferences: ["quiet", "group"], availability: ["Mon 14:00-16:00"] };
      const userB = { major: "CS", studyPreferences: ["quiet"], availability: ["Mon 15:00-17:00"] };

      const score = calculateMatchScore(userA, userB);
      expect(score).toBeGreaterThan(0);
    });
  });

  describe("saveMatch", () => {
    it("should return matchId and score", async () => {
      const userA = { uid: "userA" };
      const userB = { uid: "userB" };
      const score = 50;

      const result = await saveMatch(userA, userB, score);

      expect(result).toHaveProperty("matchId");
      expect(result).toHaveProperty("score", 50);
    });
  });

  describe("generateRecommendations", () => {
    it("should return an array of matches", async () => {
      const uid = "userA";

      const recs = await generateRecommendations(uid);

      expect(Array.isArray(recs)).toBe(true);
      expect(recs[0]).toHaveProperty("score");
      expect(recs[0]).toHaveProperty("user");
    });
  });
});