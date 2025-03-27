const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    avatar: {
        type: String,
        default: 'default-avatar.png'
    },
    bio: {
        type: String,
        maxlength: 500
    },
    skills: [{
        type: String,
        trim: true
    }],
    points: {
        type: Number,
        default: 0
    },
    rank: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'],
        default: 'Beginner'
    },
    lastActive: {
        type: Date,
        default: Date.now
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    socialLinks: {
        github: String,
        twitter: String,
        linkedin: String
    }
}, {
    timestamps: true
});

// Indexes
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ points: -1 });
userSchema.index({ lastActive: -1 });

// Virtual for user's full name
userSchema.virtual('fullName').get(function () {
    return this.username;
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Update last active timestamp
userSchema.methods.updateLastActive = async function () {
    this.lastActive = new Date();
    await this.save();
};

// Update user rank based on points
userSchema.methods.updateRank = async function () {
    const points = this.points;
    let newRank = 'Beginner';

    if (points >= 10000) newRank = 'Master';
    else if (points >= 5000) newRank = 'Expert';
    else if (points >= 2000) newRank = 'Advanced';
    else if (points >= 500) newRank = 'Intermediate';

    if (this.rank !== newRank) {
        this.rank = newRank;
        await this.save();
    }
};

// Add points to user
userSchema.methods.addPoints = async function (points) {
    this.points += points;
    await this.updateRank();
    await this.save();
};

// Static method to find user by email
userSchema.statics.findByEmail = function (email) {
    return this.findOne({ email: email.toLowerCase() });
};

// Static method to find user by username
userSchema.statics.findByUsername = function (username) {
    return this.findOne({ username: username.toLowerCase() });
};

// Static method to get leaderboard
userSchema.statics.getLeaderboard = async function (limit = 10) {
    return this.find()
        .select('username avatar points rank')
        .sort({ points: -1 })
        .limit(limit);
};

const User = mongoose.model('User', userSchema);

module.exports = User; 