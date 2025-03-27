import express from 'express';
import {
    getPosts,
    createPost,
    getPost,
    updatePost,
    deletePost,
    toggleLike,
    addComment,
    toggleCommentLike,
    getTrendingTopics,
    getActiveUsers
} from '../controllers/communityController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/posts', getPosts);
router.get('/posts/:id', getPost);
router.get('/trending-topics', getTrendingTopics);
router.get('/active-users', getActiveUsers);

// Protected routes
router.post('/posts', authenticateToken, createPost);
router.put('/posts/:id', authenticateToken, updatePost);
router.delete('/posts/:id', authenticateToken, deletePost);
router.post('/posts/:id/like', authenticateToken, toggleLike);
router.post('/posts/:id/comments', authenticateToken, addComment);
router.post('/posts/:id/comments/:commentIndex/like', authenticateToken, toggleCommentLike);

export default router; 