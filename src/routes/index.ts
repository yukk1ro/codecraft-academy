import express from "express";
import authRoutes from "./authRoutes";
import userRoutes from "./userRoutes";
import challengeRoutes from "./challengeRoutes";
import progressRoutes from "./progressRoutes";
import leaderboardRoutes from "./leaderboardRoutes";
import communityRoutes from "./communityRoutes";

const router = express.Router();

// API routes
router.use("/api/auth", authRoutes);
router.use("/api/users", userRoutes);
router.use("/api/challenges", challengeRoutes);
router.use("/api/progress", progressRoutes);
router.use("/api/leaderboard", leaderboardRoutes);
router.use("/api/community", communityRoutes);

export default router;
