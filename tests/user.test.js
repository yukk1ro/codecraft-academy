const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');

describe('User API', () => {
    let testUser;
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
        await mongoose.connection.close();
    });

    describe('POST /api/users/register', () => {
        it('should register a new user', async () => {
            const response = await request(app)
                .post('/api/users/register')
                .send({
                    username: 'newuser',
                    email: 'new@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('token');
            expect(response.body.user).toHaveProperty('username', 'newuser');
            expect(response.body.user).toHaveProperty('email', 'new@example.com');
        });

        it('should not register user with existing email', async () => {
            const response = await request(app)
                .post('/api/users/register')
                .send({
                    username: 'anotheruser',
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/users/login', () => {
        it('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/api/users/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body.user).toHaveProperty('username', 'testuser');
        });

        it('should not login with invalid password', async () => {
            const response = await request(app)
                .post('/api/users/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/users/profile', () => {
        it('should get user profile', async () => {
            const response = await request(app)
                .get('/api/users/profile')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('username', 'testuser');
            expect(response.body).toHaveProperty('email', 'test@example.com');
        });

        it('should not get profile without token', async () => {
            const response = await request(app)
                .get('/api/users/profile');

            expect(response.status).toBe(401);
        });
    });

    describe('PUT /api/users/profile', () => {
        it('should update user profile', async () => {
            const response = await request(app)
                .put('/api/users/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    bio: 'Test bio',
                    skills: ['JavaScript', 'Node.js']
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('bio', 'Test bio');
            expect(response.body.skills).toContain('JavaScript');
        });

        it('should not update password through profile update', async () => {
            const response = await request(app)
                .put('/api/users/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    password: 'newpassword'
                });

            expect(response.status).toBe(200);
            expect(response.body).not.toHaveProperty('password');
        });
    });

    describe('PUT /api/users/change-password', () => {
        it('should change password with valid current password', async () => {
            const response = await request(app)
                .put('/api/users/change-password')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    currentPassword: 'password123',
                    newPassword: 'newpassword123'
                });

            expect(response.status).toBe(200);

            // Verify new password works
            const loginResponse = await request(app)
                .post('/api/users/login')
                .send({
                    email: 'test@example.com',
                    password: 'newpassword123'
                });

            expect(loginResponse.status).toBe(200);
        });

        it('should not change password with invalid current password', async () => {
            const response = await request(app)
                .put('/api/users/change-password')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    currentPassword: 'wrongpassword',
                    newPassword: 'newpassword123'
                });

            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/users/forgot-password', () => {
        it('should send password reset email for existing user', async () => {
            const response = await request(app)
                .post('/api/users/forgot-password')
                .send({
                    email: 'test@example.com'
                });

            expect(response.status).toBe(200);
        });

        it('should handle non-existent email gracefully', async () => {
            const response = await request(app)
                .post('/api/users/forgot-password')
                .send({
                    email: 'nonexistent@example.com'
                });

            expect(response.status).toBe(404);
        });
    });

    describe('GET /api/users/leaderboard', () => {
        it('should return user leaderboard', async () => {
            const response = await request(app)
                .get('/api/users/leaderboard');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });
}); 