import express from "express";
import { userController } from "../controllers/userController";
import { challengeController } from "../controllers/challengeController";
import { progressController } from "../controllers/progressController";
import { auth, optionalAuth } from "../middleware/auth";

const router = express.Router();

// Auth routes
router.post("/auth/register", userController.register);
router.post("/auth/login", userController.login);
router.get("/auth/profile", auth, userController.getProfile);
router.put("/auth/profile", auth, userController.updateProfile);

// Challenge routes
router.get("/challenges", optionalAuth, challengeController.getAllChallenges);
router.get("/challenges/:id", optionalAuth, challengeController.getChallenge);
router.get("/challenges/:id/hints", auth, challengeController.getHints);

// Admin challenge routes
router.post("/admin/challenges", auth, challengeController.createChallenge);
router.put("/admin/challenges/:id", auth, challengeController.updateChallenge);
router.delete(
  "/admin/challenges/:id",
  auth,
  challengeController.deleteChallenge
);

// Progress routes
router.get("/progress", auth, progressController.getUserProgress);
router.get(
  "/progress/:challengeId",
  auth,
  progressController.getChallengeProgress
);
router.post(
  "/progress/:challengeId/submit",
  auth,
  progressController.submitSolution
);
router.get("/achievements", auth, progressController.getUserAchievements);

export default router;
