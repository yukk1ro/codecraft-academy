import { Request, Response } from "express";
import { Challenge } from "../models/Challenge";
import { UserProgress } from "../models/UserProgress";

export const challengeController = {
  // Get all challenges
  async getAllChallenges(req: Request, res: Response) {
    try {
      const { difficulty, category } = req.query;
      const query: any = {};

      if (difficulty) query.difficulty = difficulty;
      if (category) query.category = category;

      const challenges = await Challenge.find(query);
      res.json({
        success: true,
        challenges,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching challenges",
        error: error.message,
      });
    }
  },

  // Get single challenge
  async getChallenge(req: Request, res: Response) {
    try {
      const challenge = await Challenge.findById(req.params.id);
      if (!challenge) {
        return res.status(404).json({
          success: false,
          message: "Challenge not found",
        });
      }

      // If user is authenticated, get their progress
      let userProgress = null;
      if (req.user) {
        userProgress = await UserProgress.findOne({
          user: req.user.userId,
          challenge: challenge._id,
        });
      }

      res.json({
        success: true,
        challenge,
        userProgress,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching challenge",
        error: error.message,
      });
    }
  },

  // Create new challenge (admin only)
  async createChallenge(req: Request, res: Response) {
    try {
      const challenge = new Challenge(req.body);
      await challenge.save();

      res.status(201).json({
        success: true,
        challenge,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error creating challenge",
        error: error.message,
      });
    }
  },

  // Update challenge (admin only)
  async updateChallenge(req: Request, res: Response) {
    try {
      const challenge = await Challenge.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

      if (!challenge) {
        return res.status(404).json({
          success: false,
          message: "Challenge not found",
        });
      }

      res.json({
        success: true,
        challenge,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error updating challenge",
        error: error.message,
      });
    }
  },

  // Delete challenge (admin only)
  async deleteChallenge(req: Request, res: Response) {
    try {
      const challenge = await Challenge.findByIdAndDelete(req.params.id);

      if (!challenge) {
        return res.status(404).json({
          success: false,
          message: "Challenge not found",
        });
      }

      res.json({
        success: true,
        message: "Challenge deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error deleting challenge",
        error: error.message,
      });
    }
  },

  // Get challenge hints
  async getHints(req: Request, res: Response) {
    try {
      const challenge = await Challenge.findById(req.params.id);
      if (!challenge) {
        return res.status(404).json({
          success: false,
          message: "Challenge not found",
        });
      }

      res.json({
        success: true,
        hints: challenge.hints,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching hints",
        error: error.message,
      });
    }
  },
};
