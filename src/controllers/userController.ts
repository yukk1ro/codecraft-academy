import { Request, Response } from "express";
import { User } from "../models/User";
import jwt from "jsonwebtoken";
import { config } from "../config";

export const userController = {
  // Register new user
  async register(req: Request, res: Response) {
    try {
      const { username, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User with this email or username already exists",
        });
      }

      // Create new user
      const user = new User({
        username,
        email,
        password,
      });

      await user.save();

      // Generate JWT token
      const token = jwt.sign({ userId: user._id }, config.jwtSecret, {
        expiresIn: "7d",
      });

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          level: user.level,
          experience: user.experience,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error creating user",
        error: error.message,
      });
    }
  },

  // Login user
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT token
      const token = jwt.sign({ userId: user._id }, config.jwtSecret, {
        expiresIn: "7d",
      });

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          level: user.level,
          experience: user.experience,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error logging in",
        error: error.message,
      });
    }
  },

  // Get user profile
  async getProfile(req: Request, res: Response) {
    try {
      const user = await User.findById(req.user.userId).select("-password");
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching user profile",
        error: error.message,
      });
    }
  },

  // Update user profile
  async updateProfile(req: Request, res: Response) {
    try {
      const { username, email, avatar } = req.body;
      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Update fields if provided
      if (username) user.username = username;
      if (email) user.email = email;
      if (avatar) user.avatar = avatar;

      await user.save();

      res.json({
        success: true,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          level: user.level,
          experience: user.experience,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error updating user profile",
        error: error.message,
      });
    }
  },
};
