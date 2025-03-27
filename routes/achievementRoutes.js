const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievementController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.get('/', authenticate, achievementController.getUserAchievements);
router.get('/stats', authenticate, achievementController.getUserStats);
router.get('/recent', authenticate, achievementController.getRecentAchievements);
router.get('/:id', authenticate, achievementController.getAchievementDetails);
router.get('/category/:category', authenticate, achievementController.getAchievementsByCategory);

// Protected routes (require admin access)
router.post('/', authenticate, authorize('admin'), achievementController.createAchievement);
router.put('/:id', authenticate, authorize('admin'), achievementController.updateAchievement);
router.delete('/:id', authenticate, authorize('admin'), achievementController.deleteAchievement);

// Achievement progress update
router.post('/progress', authenticate, achievementController.updateProgress);

module.exports = router; 