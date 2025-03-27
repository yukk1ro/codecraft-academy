const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Achievement = require('../models/Achievement');
const User = require('../models/User');
const UserAchievement = require('../models/UserAchievement');

describe('Achievement API', () => {
    let testUser;
    let testAchievement;
    let authToken;

    beforeAll(async () => {
        // Connect to test database
        await mongoose.connect(process.env.MONGODB_TEST_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        // Create test user
        testUser = await User.create({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
        });

        // Create test achievement
        testAchievement = await Achievement.create({
            name: 'Test Achievement',
            description: 'Test Description',
            icon: 'test-icon.png',
            category: 'challenges',
            required: 10,
            unit: 'points',
            points: 100
        });

        // Generate auth token
        const response = await request(app)
            .post('/api/users/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });

        authToken = response.body.token;
    });

    afterAll(async () => {
        // Clean up test data
        await User.deleteMany({});
        await Achievement.deleteMany({});
        await UserAchievement.deleteMany({});
        await mongoose.connection.close();
    });

    describe('GET /api/achievements', () => {
        it('should return all achievements for the user', async () => {
            const response = await request(app)
                .get('/api/achievements')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('achievements');
            expect(response.body).toHaveProperty('categories');
        });
    });

    describe('GET /api/achievements/:id', () => {
        it('should return achievement details', async () => {
            const response = await request(app)
                .get(`/api/achievements/${testAchievement._id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('name', 'Test Achievement');
            expect(response.body).toHaveProperty('progress', 0);
            expect(response.body).toHaveProperty('completed', false);
        });

        it('should return 404 for non-existent achievement', async () => {
            const response = await request(app)
                .get('/api/achievements/123456789012')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
        });
    });

    describe('POST /api/achievements/progress', () => {
        it('should update achievement progress', async () => {
            const response = await request(app)
                .post('/api/achievements/progress')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    achievementId: testAchievement._id,
                    progress: 5
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('progress', 5);
            expect(response.body).toHaveProperty('completed', false);
        });

        it('should mark achievement as completed when progress meets required', async () => {
            const response = await request(app)
                .post('/api/achievements/progress')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    achievementId: testAchievement._id,
                    progress: 10
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('progress', 10);
            expect(response.body).toHaveProperty('completed', true);
            expect(response.body).toHaveProperty('completedAt');
        });
    });

    describe('GET /api/achievements/stats', () => {
        it('should return user achievement statistics', async () => {
            const response = await request(app)
                .get('/api/achievements/stats')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('totalAchievements');
            expect(response.body).toHaveProperty('completedAchievements');
            expect(response.body).toHaveProperty('totalPoints');
        });
    });

    describe('GET /api/achievements/recent', () => {
        it('should return recent achievements', async () => {
            const response = await request(app)
                .get('/api/achievements/recent')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('GET /api/achievements/category/:category', () => {
        it('should return achievements by category', async () => {
            const response = await request(app)
                .get(`/api/achievements/category/challenges`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.every(a => a.category === 'challenges')).toBe(true);
        });
    });
}); 