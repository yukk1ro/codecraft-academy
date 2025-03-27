const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');
const { handleError } = require('../utils/errorHandler');

// Get all achievements for the current user
exports.getUserAchievements = async (req, res) => {
    try {
        const achievements = await Achievement.getUserAchievements(req.user._id);
        const categories = await Achievement.getCategories();

        res.json({
            achievements,
            categories
        });
    } catch (error) {
        handleError(res, error);
    }
};

// Get achievement details
exports.getAchievementDetails = async (req, res) => {
    try {
        const achievement = await Achievement.findById(req.params.id);
        if (!achievement) {
            return res.status(404).json({ message: 'Achievement not found' });
        }

        const userAchievement = await UserAchievement.findOne({
            achievement: achievement._id,
            user: req.user._id
        });

        const details = {
            ...achievement.toObject(),
            progress: userAchievement ? userAchievement.progress : 0,
            completed: userAchievement ? userAchievement.completed : false,
            completedAt: userAchievement ? userAchievement.completedAt : null
        };

        res.json(details);
    } catch (error) {
        handleError(res, error);
    }
};

// Update achievement progress
exports.updateProgress = async (req, res) => {
    try {
        const { achievementId, progress } = req.body;

        const achievement = await Achievement.findById(achievementId);
        if (!achievement) {
            return res.status(404).json({ message: 'Achievement not found' });
        }

        await achievement.updateProgress(req.user._id, progress);

        // Get updated achievement details
        const updatedAchievement = await Achievement.getUserAchievements(req.user._id)
            .then(achievements => achievements.find(a => a._id.toString() === achievementId));

        res.json(updatedAchievement);
    } catch (error) {
        handleError(res, error);
    }
};

// Get user achievement stats
exports.getUserStats = async (req, res) => {
    try {
        const stats = await UserAchievement.getUserStats(req.user._id);
        res.json(stats);
    } catch (error) {
        handleError(res, error);
    }
};

// Get recent achievements
exports.getRecentAchievements = async (req, res) => {
    try {
        const achievements = await UserAchievement.getRecentAchievements(req.user._id);
        res.json(achievements);
    } catch (error) {
        handleError(res, error);
    }
};

// Get achievements by category
exports.getAchievementsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const achievements = await Achievement.getUserAchievements(req.user._id)
            .then(achievements => achievements.filter(a => a.category === category));

        res.json(achievements);
    } catch (error) {
        handleError(res, error);
    }
};

// Admin: Create new achievement
exports.createAchievement = async (req, res) => {
    try {
        const achievement = new Achievement(req.body);
        await achievement.save();
        res.status(201).json(achievement);
    } catch (error) {
        handleError(res, error);
    }
};

// Admin: Update achievement
exports.updateAchievement = async (req, res) => {
    try {
        const achievement = await Achievement.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!achievement) {
            return res.status(404).json({ message: 'Achievement not found' });
        }

        res.json(achievement);
    } catch (error) {
        handleError(res, error);
    }
};

// Admin: Delete achievement
exports.deleteAchievement = async (req, res) => {
    try {
        const achievement = await Achievement.findByIdAndDelete(req.params.id);

        if (!achievement) {
            return res.status(404).json({ message: 'Achievement not found' });
        }

        // Delete all user achievements associated with this achievement
        await UserAchievement.deleteMany({ achievement: req.params.id });

        res.json({ message: 'Achievement deleted successfully' });
    } catch (error) {
        handleError(res, error);
    }
}; 