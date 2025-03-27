const mongoose = require('mongoose');

const userAchievementSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    achievement: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Achievement',
        required: true
    },
    progress: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    completed: {
        type: Boolean,
        required: true,
        default: false
    },
    completedAt: {
        type: Date
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Indexes
userAchievementSchema.index({ user: 1, achievement: 1 }, { unique: true });
userAchievementSchema.index({ user: 1, completed: 1 });
userAchievementSchema.index({ completedAt: 1 });

// Methods
userAchievementSchema.methods.updateProgress = async function (progress) {
    this.progress = progress;
    this.completed = progress >= this.achievement.required;
    if (this.completed && !this.completedAt) {
        this.completedAt = new Date();
    }
    await this.save();
};

// Statics
userAchievementSchema.statics.getUserStats = async function (userId) {
    const stats = await this.aggregate([
        {
            $match: { user: mongoose.Types.ObjectId(userId) }
        },
        {
            $lookup: {
                from: 'achievements',
                localField: 'achievement',
                foreignField: '_id',
                as: 'achievement'
            }
        },
        {
            $unwind: '$achievement'
        },
        {
            $group: {
                _id: null,
                totalAchievements: { $sum: 1 },
                completedAchievements: {
                    $sum: { $cond: [{ $eq: ['$completed', true] }, 1, 0] }
                },
                totalPoints: {
                    $sum: {
                        $cond: [
                            { $eq: ['$completed', true] },
                            '$achievement.points',
                            0
                        ]
                    }
                }
            }
        }
    ]);

    return stats[0] || {
        totalAchievements: 0,
        completedAchievements: 0,
        totalPoints: 0
    };
};

userAchievementSchema.statics.getRecentAchievements = async function (userId, limit = 5) {
    return this.find({
        user: userId,
        completed: true
    })
        .sort({ completedAt: -1 })
        .limit(limit)
        .populate('achievement');
};

const UserAchievement = mongoose.model('UserAchievement', userAchievementSchema);

module.exports = UserAchievement; 