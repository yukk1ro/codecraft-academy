import { Request, Response } from "express";
import User from "../models/user";
import UserProgress from "../models/userProgress";

const ITEMS_PER_PAGE = 10;

export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const time = (req.query.time as string) || "all";
    const category = (req.query.category as string) || "all";
    const search = (req.query.search as string) || "";

    // Build query
    const query: any = {};

    // Apply time filter
    if (time !== "all") {
      const now = new Date();
      let startDate = new Date();

      switch (time) {
        case "daily":
          startDate.setDate(now.getDate() - 1);
          break;
        case "weekly":
          startDate.setDate(now.getDate() - 7);
          break;
        case "monthly":
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      query.createdAt = { $gte: startDate };
    }

    // Apply category filter
    if (category !== "all") {
      query.category = category;
    }

    // Apply search filter
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / ITEMS_PER_PAGE);

    // Get users with pagination
    const users = await User.find(query)
      .select("username avatar points level streak")
      .sort({ points: -1 })
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    // Get top 3 users
    const topThree = await User.find(query)
      .select("username avatar points")
      .sort({ points: -1 })
      .limit(3);

    // Get completed challenges count for each user
    const completedChallenges = await UserProgress.aggregate([
      {
        $match: {
          status: "completed",
          ...(time !== "all" && {
            completedAt: {
              $gte: new Date(Date.now() - getTimeFilterInMilliseconds(time)),
            },
          }),
        },
      },
      {
        $group: {
          _id: "$userId",
          count: { $sum: 1 },
        },
      },
    ]);

    // Add completed challenges count to users
    const usersWithChallenges = users.map((user) => {
      const userProgress = completedChallenges.find(
        (progress) => progress._id.toString() === user._id.toString()
      );
      return {
        ...user.toObject(),
        completedChallenges: userProgress ? userProgress.count : 0,
      };
    });

    res.json({
      users: usersWithChallenges,
      topThree,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ message: "Failed to fetch leaderboard data" });
  }
};

// Helper function to convert time filter to milliseconds
function getTimeFilterInMilliseconds(time: string): number {
  const now = Date.now();
  switch (time) {
    case "daily":
      return 24 * 60 * 60 * 1000;
    case "weekly":
      return 7 * 24 * 60 * 60 * 1000;
    case "monthly":
      return 30 * 24 * 60 * 60 * 1000;
    default:
      return now;
  }
}

export const getUserRank = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const time = (req.query.time as string) || "all";

    // Build query
    const query: any = {};

    // Apply time filter
    if (time !== "all") {
      const now = new Date();
      let startDate = new Date();

      switch (time) {
        case "daily":
          startDate.setDate(now.getDate() - 1);
          break;
        case "weekly":
          startDate.setDate(now.getDate() - 7);
          break;
        case "monthly":
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      query.createdAt = { $gte: startDate };
    }

    // Get user's rank
    const userRank =
      (await User.countDocuments({
        ...query,
        points: { $gt: await User.findById(userId).select("points") },
      })) + 1;

    res.json({ rank: userRank });
  } catch (error) {
    console.error("Error fetching user rank:", error);
    res.status(500).json({ message: "Failed to fetch user rank" });
  }
};
