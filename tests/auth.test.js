const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

describe('Authentication', () => {
    let testUser;
    let validToken;
    let expiredToken;

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

        // Generate valid token
        validToken = jwt.sign(
            { userId: testUser._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Generate expired token
        expiredToken = jwt.sign(
            { userId: testUser._id },
            process.env.JWT_SECRET,
            { expiresIn: '0s' }
        );
    });

    afterAll(async () => {
        // Clean up test data
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    describe('Token Validation', () => {
        it('should accept valid token', async () => {
            const response = await request(app)
                .get('/api/users/profile')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
        });

        it('should reject expired token', async () => {
            const response = await request(app)
                .get('/api/users/profile')
                .set('Authorization', `Bearer ${expiredToken}`);

            expect(response.status).toBe(401);
        });

        it('should reject invalid token', async () => {
            const response = await request(app)
                .get('/api/users/profile')
                .set('Authorization', 'Bearer invalid-token');

            expect(response.status).toBe(401);
        });

        it('should reject request without token', async () => {
            const response = await request(app)
                .get('/api/users/profile');

            expect(response.status).toBe(401);
        });
    });

    describe('Role Authorization', () => {
        let adminUser;
        let adminToken;

        beforeAll(async () => {
            // Create admin user
            adminUser = await User.create({
                username: 'admin',
                email: 'admin@example.com',
                password: 'password123',
                role: 'admin'
            });

            // Generate admin token
            adminToken = jwt.sign(
                { userId: adminUser._id },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );
        });

        afterAll(async () => {
            await User.deleteOne({ _id: adminUser._id });
        });

        it('should allow admin to access admin routes', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
        });

        it('should not allow regular user to access admin routes', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(403);
        });
    });

    describe('Password Reset Flow', () => {
        let resetToken;

        it('should generate reset token', async () => {
            const response = await request(app)
                .post('/api/users/forgot-password')
                .send({
                    email: 'test@example.com'
                });

            expect(response.status).toBe(200);

            // Get user and verify reset token was generated
            const user = await User.findOne({ email: 'test@example.com' });
            expect(user.resetPasswordToken).toBeDefined();
            expect(user.resetPasswordExpires).toBeDefined();
            resetToken = user.resetPasswordToken;
        });

        it('should reset password with valid token', async () => {
            const response = await request(app)
                .post('/api/users/reset-password')
                .send({
                    token: resetToken,
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

        it('should not reset password with expired token', async () => {
            // Set token expiration to past
            await User.updateOne(
                { email: 'test@example.com' },
                { resetPasswordExpires: Date.now() - 3600000 }
            );

            const response = await request(app)
                .post('/api/users/reset-password')
                .send({
                    token: resetToken,
                    newPassword: 'anotherpassword123'
                });

            expect(response.status).toBe(400);
        });
    });

    describe('Email Verification', () => {
        let verificationToken;

        it('should generate verification token for new user', async () => {
            const response = await request(app)
                .post('/api/users/register')
                .send({
                    username: 'newuser',
                    email: 'new@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(201);

            // Get user and verify token was generated
            const user = await User.findOne({ email: 'new@example.com' });
            expect(user.verificationToken).toBeDefined();
            verificationToken = user.verificationToken;
        });

        it('should verify email with valid token', async () => {
            const response = await request(app)
                .get(`/api/users/verify-email/${verificationToken}`);

            expect(response.status).toBe(200);

            // Verify user is marked as verified
            const user = await User.findOne({ email: 'new@example.com' });
            expect(user.isVerified).toBe(true);
            expect(user.verificationToken).toBeUndefined();
        });

        it('should not verify email with invalid token', async () => {
            const response = await request(app)
                .get('/api/users/verify-email/invalid-token');

            expect(response.status).toBe(400);
        });
    });
}); 