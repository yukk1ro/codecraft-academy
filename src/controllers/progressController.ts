import { Request, Response } from "express";
import { UserProgress } from "../models/UserProgress";
import { Challenge } from "../models/Challenge";
import { User } from "../models/User";

export const progressController = {
  // Get user's progress for all challenges
  async getUserProgress(req: Request, res: Response) {
    try {
      const progress = await UserProgress.find({ user: req.user.userId })
        .populate("challenge")
        .sort({ updatedAt: -1 });

      res.json({
        success: true,
        progress,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching user progress",
        error: error.message,
      });
    }
  },

  // Get user's progress for a specific challenge
  async getChallengeProgress(req: Request, res: Response) {
    try {
      const progress = await UserProgress.findOne({
        user: req.user.userId,
        challenge: req.params.challengeId,
      }).populate("challenge");

      if (!progress) {
        return res.status(404).json({
          success: false,
          message: "Progress not found",
        });
      }

      res.json({
        success: true,
        progress,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching challenge progress",
        error: error.message,
      });
    }
  },

  // Submit solution for a challenge
  async submitSolution(req: Request, res: Response) {
    try {
      const { code } = req.body;
      const challenge = await Challenge.findById(req.params.challengeId);

      if (!challenge) {
        return res.status(404).json({
          success: false,
          message: "Challenge not found",
        });
      }

      // Find or create progress
      let progress = await UserProgress.findOne({
        user: req.user.userId,
        challenge: challenge._id,
      });

      if (!progress) {
        progress = new UserProgress({
          user: req.user.userId,
          challenge: challenge._id,
          code,
        });
      } else {
        progress.code = code;
        progress.attempts += 1;
        progress.lastAttempt = new Date();
      }

      // TODO: Implement code execution and testing
      const testResults = await executeAndTestCode(code, challenge.testCases);

      if (testResults.success) {
        progress.status = "completed";
        progress.completedAt = new Date();
        progress.score = calculateScore(challenge.points, progress.attempts);

        // Update user experience and level
        const user = await User.findById(req.user.userId);
        user.experience += progress.score;
        user.level = calculateLevel(user.experience);
        await user.save();
      } else {
        progress.status = "failed";
        progress.feedback = testResults.feedback;
      }

      await progress.save();

      res.json({
        success: true,
        progress,
        testResults,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error submitting solution",
        error: error.message,
      });
    }
  },

  // Get user's achievements
  async getUserAchievements(req: Request, res: Response) {
    try {
      const user = await User.findById(req.user.userId);
      res.json({
        success: true,
        achievements: user.achievements,
        badges: user.badges,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching achievements",
        error: error.message,
      });
    }
  },
};

// Helper functions
async function executeAndTestCode(code: string, testCases: any[]) {
  // TODO: Implement actual code execution and testing
  return {
    success: true,
    feedback: "All tests passed!",
  };
}

function calculateScore(basePoints: number, attempts: number): number {
  // Reduce points based on number of attempts
  const reduction = Math.min(attempts - 1, 5) * 0.1;
  return Math.round(basePoints * (1 - reduction));
}

function calculateLevel(experience: number): number {
  // Simple level calculation based on experience
  return Math.floor(Math.sqrt(experience / 100)) + 1;
}
