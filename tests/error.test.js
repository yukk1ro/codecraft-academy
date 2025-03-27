const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Achievement = require('../models/Achievement');

describe('Error Handling', () => {
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
        await Achievement.deleteMany({});
        await mongoose.connection.close();
    });

    describe('Validation Errors', () => {
        it('should handle invalid email format', async () => {
            const response = await request(app)
                .post('/api/users/register')
                .send({
                    username: 'newuser',
                    email: 'invalid-email',
                    password: 'password123'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message', 'Validation Error');
            expect(response.body.errors).toContain('Invalid email format');
        });

        it('should handle password too short', async () => {
            const response = await request(app)
                .post('/api/users/register')
                .send({
                    username: 'newuser',
                    email: 'new@example.com',
                    password: '123'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message', 'Validation Error');
            expect(response.body.errors).toContain('Password must be at least 6 characters long');
        });

        it('should handle duplicate email', async () => {
            const response = await request(app)
                .post('/api/users/register')
                .send({
                    username: 'anotheruser',
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message', 'Duplicate field value entered');
            expect(response.body).toHaveProperty('field', 'email');
        });
    });

    describe('Authentication Errors', () => {
        it('should handle invalid token', async () => {
            const response = await request(app)
                .get('/api/users/profile')
                .set('Authorization', 'Bearer invalid-token');

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('message', 'Invalid token');
        });

        it('should handle missing token', async () => {
            const response = await request(app)
                .get('/api/users/profile');

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('message', 'Authentication required');
        });

        it('should handle expired token', async () => {
