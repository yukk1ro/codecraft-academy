const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    icon: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['challenges', 'community', 'learning', 'streak', 'special']
    },
    required: {
        type: Number,
        required: true,
        min: 0
    },
    unit: {
        type: String,
        required: true
    },
    points: {
        type: Number,
        required: true,
        min: 0
    },
    isSecret: {
        type: Boolean,
        default: false
    },
    requirements: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Indexes
achievementSchema.index({ category: 1 });
achievementSchema.index({ name: 1 }, { unique: true });

// Virtual for checking if achievement is completed
achievementSchema.virtual('isCompleted').get(function () {
    return this.progress >= this.required;
});

// Methods
achievementSchema.methods.updateProgress = async function (userId, progress) {
    const userAchievement = await this.model('UserAchievement').findOne({
        achievement: this._id,
        user: userId
    });

    if (!userAchievement) {
        await this.model('UserAchievement').create({
            achievement: this._id,
            user: userId,
            progress: progress,
            completed: progress >= this.required,
            completedAt: progress >= this.required ? new Date() : null
        });
    } else {
        userAchievement.progress = progress;
        userAchievement.completed = progress >= this.required;
        if (progress >= this.required && !userAchievement.completedAt) {
            userAchievement.completedAt = new Date();
        }
        await userAchievement.save();
    }
};

// Statics
achievementSchema.statics.getUserAchievements = async function (userId) {
    const achievements = await this.find();
    const userAchievements = await this.model('UserAchievement').find({ user: userId });

    return achievements.map(achievement => {
        const userAchievement = userAchievements.find(
            ua => ua.achievement.toString() === achievement._id.toString()
        );

        return {
            ...achievement.toObject(),
            progress: userAchievement ? userAchievement.progress : 0,
            completed: userAchievement ? userAchievement.completed : false,
            completedAt: userAchievement ? userAchievement.completedAt : null
        };
    });
};

achievementSchema.statics.getCategories = async function () {
    const categories = await this.aggregate([
        {
            $group: {
                _id: '$category',
                count: { $sum: 1 }
            }
        },
        {
            $project: {
                name: '$_id',
                count: 1,
                _id: 0
            }
        }
    ]);

    return categories;
};

const Achievement = mongoose.model('Achievement', achievementSchema);

module.exports = Achievement; 