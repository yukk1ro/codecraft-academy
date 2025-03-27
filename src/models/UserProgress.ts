import mongoose, { Document, Schema } from "mongoose";
import { IUser } from "./User";
import { IChallenge } from "./Challenge";

export interface IUserProgress extends Document {
  user: IUser["_id"];
  challenge: IChallenge["_id"];
  status: "not_started" | "in_progress" | "completed" | "failed";
  code: string;
  attempts: number;
  lastAttempt: Date;
  completedAt?: Date;
  score: number;
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userProgressSchema = new Schema<IUserProgress>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  challenge: {
    type: Schema.Types.ObjectId,
    ref: "Challenge",
    required: true,
  },
  status: {
    type: String,
    enum: ["not_started", "in_progress", "completed", "failed"],
    default: "not_started",
  },
  code: {
    type: String,
    default: "",
  },
  attempts: {
    type: Number,
    default: 0,
  },
  lastAttempt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
  score: {
    type: Number,
    default: 0,
  },
  feedback: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create compound index for unique user-challenge combination
userProgressSchema.index({ user: 1, challenge: 1 }, { unique: true });

// Update the updatedAt timestamp before saving
userProgressSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export const UserProgress = mongoose.model<IUserProgress>(
  "UserProgress",
  userProgressSchema
);
