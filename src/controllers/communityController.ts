import { Request, Response } from "express";
import CommunityPost from "../models/communityPost";

const ITEMS_PER_PAGE = 10;

export const getPosts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const type = (req.query.type as string) || "all";
    const sort = (req.query.sort as string) || "recent";
    const search = (req.query.search as string) || "";

    // Build query
    const query: any = {};

    // Apply type filter
    if (type !== "all") {
      query.type = type;
    }

    // Apply search filter
    if (search) {
      query.$text = { $search: search };
    }

    // Get total count for pagination
    const totalPosts = await CommunityPost.countDocuments(query);
    const totalPages = Math.ceil(totalPosts / ITEMS_PER_PAGE);

    // Build sort options
    let sortOptions = {};
    switch (sort) {
      case "popular":
        sortOptions = { views: -1, createdAt: -1 };
        break;
      case "trending":
        sortOptions = { "comments.length": -1, createdAt: -1 };
        break;
      default: // recent
        sortOptions = { createdAt: -1 };
    }

    // Get posts with pagination
    const posts = await CommunityPost.find(query)
      .populate("author", "username avatar")
      .populate("comments.author", "username avatar")
      .sort(sortOptions)
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    res.json({
      posts,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Failed to fetch posts" });
  }
};

export const createPost = async (req: Request, res: Response) => {
  try {
    const { title, content, type, tags } = req.body;
    const userId = req.user._id;

    const post = new CommunityPost({
      title,
      content,
      type,
      tags: tags || [],
      author: userId,
    });

    await post.save();
    await post.populate("author", "username avatar");

    res.status(201).json(post);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Failed to create post" });
  }
};

export const getPost = async (req: Request, res: Response) => {
  try {
    const post = await CommunityPost.findById(req.params.id)
      .populate("author", "username avatar")
      .populate("comments.author", "username avatar");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Increment view count
    await post.incrementViews();

    res.json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ message: "Failed to fetch post" });
  }
};

export const updatePost = async (req: Request, res: Response) => {
  try {
    const { title, content, type, tags } = req.body;
    const post = await CommunityPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user is the author
    if (post.author.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this post" });
    }

    post.title = title;
    post.content = content;
    post.type = type;
    post.tags = tags || [];

    await post.save();
    await post.populate("author", "username avatar");
    await post.populate("comments.author", "username avatar");

    res.json(post);
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ message: "Failed to update post" });
  }
};

export const deletePost = async (req: Request, res: Response) => {
  try {
    const post = await CommunityPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user is the author
    if (post.author.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this post" });
    }

    await post.remove();
    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Failed to delete post" });
  }
};

export const toggleLike = async (req: Request, res: Response) => {
  try {
    const post = await CommunityPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    await post.toggleLike(req.user._id);
    await post.populate("author", "username avatar");
    await post.populate("comments.author", "username avatar");

    res.json(post);
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ message: "Failed to toggle like" });
  }
};

export const addComment = async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    const post = await CommunityPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    await post.addComment(req.user._id, content);
    await post.populate("author", "username avatar");
    await post.populate("comments.author", "username avatar");

    res.json(post);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Failed to add comment" });
  }
};

export const toggleCommentLike = async (req: Request, res: Response) => {
  try {
    const { commentIndex } = req.params;
    const post = await CommunityPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    await post.toggleCommentLike(parseInt(commentIndex), req.user._id);
    await post.populate("author", "username avatar");
    await post.populate("comments.author", "username avatar");

    res.json(post);
  } catch (error) {
    console.error("Error toggling comment like:", error);
    res.status(500).json({ message: "Failed to toggle comment like" });
  }
};

export const getTrendingTopics = async (req: Request, res: Response) => {
  try {
    const topics = await CommunityPost.getTrendingTopics();
    res.json({ topics });
  } catch (error) {
    console.error("Error fetching trending topics:", error);
    res.status(500).json({ message: "Failed to fetch trending topics" });
  }
};

export const getActiveUsers = async (req: Request, res: Response) => {
  try {
    const users = await CommunityPost.getActiveUsers();
    res.json({ users });
  } catch (error) {
    console.error("Error fetching active users:", error);
    res.status(500).json({ message: "Failed to fetch active users" });
  }
};
