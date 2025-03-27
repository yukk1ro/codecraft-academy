import express from "express";
import {
  getLeaderboard,
  getUserRank,
} from "../controllers/leaderboardController";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// Get leaderboard with filters and pagination
router.get("/", getLeaderboard);

// Get user's rank (requires authentication)
router.get("/rank/:userId", authenticateToken, getUserRank);

export default router;
