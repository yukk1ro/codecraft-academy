import mongoose, { Document, Schema } from "mongoose";

export interface IChallenge extends Document {
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  category: string;
  points: number;
  codeTemplate: string;
  testCases: {
    input: string;
    output: string;
    description: string;
  }[];
  hints: string[];
  solution: string;
  createdAt: Date;
  updatedAt: Date;
}

const challengeSchema = new Schema<IChallenge>({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"],
    required: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  points: {
    type: Number,
    required: true,
    min: 0,
  },
  codeTemplate: {
    type: String,
    required: true,
  },
  testCases: [
    {
      input: {
        type: String,
        required: true,
      },
      output: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
    },
  ],
  hints: [
    {
      type: String,
    },
  ],
  solution: {
    type: String,
    required: true,
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

// Update the updatedAt timestamp before saving
challengeSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export const Challenge = mongoose.model<IChallenge>(
  "Challenge",
  challengeSchema
);
