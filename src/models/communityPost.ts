import mongoose, { Schema, Document } from "mongoose";

export interface ICommunityPost extends Document {
  title: string;
  content: string;
  type: "discussion" | "question" | "share";
  author: mongoose.Types.ObjectId;
  tags: string[];
  likes: mongoose.Types.ObjectId[];
  comments: {
    author: mongoose.Types.ObjectId;
    content: string;
    createdAt: Date;
    likes: mongoose.Types.ObjectId[];
  }[];
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const communityPostSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["discussion", "question", "share"],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        author: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        content: {
          type: String,
          required: true,
          trim: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        likes: [
          {
            type: Schema.Types.ObjectId,
            ref: "User",
          },
        ],
      },
    ],
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
communityPostSchema.index({ title: "text", content: "text", tags: "text" });
communityPostSchema.index({ author: 1, createdAt: -1 });
communityPostSchema.index({ type: 1, createdAt: -1 });
communityPostSchema.index({ tags: 1 });

// Virtual for comment count
communityPostSchema.virtual("commentCount").get(function () {
  return this.comments.length;
});

// Virtual for like count
communityPostSchema.virtual("likeCount").get(function () {
  return this.likes.length;
});

// Methods
communityPostSchema.methods.incrementViews = async function () {
  this.views += 1;
  await this.save();
};

communityPostSchema.methods.toggleLike = async function (
  userId: mongoose.Types.ObjectId
) {
  const index = this.likes.indexOf(userId);
  if (index === -1) {
    this.likes.push(userId);
  } else {
    this.likes.splice(index, 1);
  }
  await this.save();
};

communityPostSchema.methods.addComment = async function (
  userId: mongoose.Types.ObjectId,
  content: string
) {
  this.comments.push({
    author: userId,
    content,
  });
  await this.save();
};

communityPostSchema.methods.toggleCommentLike = async function (
  commentIndex: number,
  userId: mongoose.Types.ObjectId
) {
  const comment = this.comments[commentIndex];
  const index = comment.likes.indexOf(userId);
  if (index === -1) {
    comment.likes.push(userId);
  } else {
    comment.likes.splice(index, 1);
  }
  await this.save();
};

// Static methods
communityPostSchema.statics.getTrendingTopics = async function (
  limit: number = 10
) {
  return this.aggregate([
    { $unwind: "$tags" },
    {
      $group: {
        _id: "$tags",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: limit },
    {
      $project: {
        tag: "$_id",
        count: 1,
        _id: 0,
      },
    },
  ]);
};

communityPostSchema.statics.getActiveUsers = async function (
  limit: number = 10
) {
  return this.aggregate([
    {
      $group: {
        _id: "$author",
        postCount: { $sum: 1 },
        lastActivity: { $max: "$updatedAt" },
      },
    },
    { $sort: { lastActivity: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        _id: "$user._id",
        username: "$user.username",
        avatar: "$user.avatar",
      },
    },
  ]);
};

export default mongoose.model<ICommunityPost>(
  "CommunityPost",
  communityPostSchema
);
