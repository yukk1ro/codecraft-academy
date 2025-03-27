const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/forgot-password', userController.requestPasswordReset);
router.post('/reset-password', userController.resetPassword);
router.get('/verify-email/:token', userController.verifyEmail);
router.get('/leaderboard', userController.getLeaderboard);

// Protected routes
router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);
router.put('/change-password', authenticate, userController.changePassword);

// Admin routes
router.get('/', authenticate, authorize('admin'), userController.getAllUsers);
router.put('/:userId/role', authenticate, authorize('admin'), userController.updateUserRole);
router.delete('/:userId', authenticate, authorize('admin'), userController.deleteUser);

module.exports = router; 