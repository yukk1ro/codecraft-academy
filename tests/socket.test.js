const io = require('socket.io-client');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

describe('Socket.IO', () => {
    let socket;
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
        authToken = jwt.sign(
            { userId: testUser._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
    });

    afterAll(async () => {
        // Clean up test data
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    beforeEach((done) => {
        // Create socket connection
        socket = io('http://localhost:3000', {
            auth: {
                token: authToken
            }
        });

        socket.on('connect', () => {
            done();
        });
    });

    afterEach(() => {
        if (socket.connected) {
            socket.disconnect();
        }
    });

    describe('Connection', () => {
        it('should connect with valid token', (done) => {
            socket.on('connect', () => {
                expect(socket.connected).toBe(true);
                done();
            });
        });

        it('should not connect with invalid token', (done) => {
            const invalidSocket = io('http://localhost:3000', {
                auth: {
                    token: 'invalid-token'
                }
            });

            invalidSocket.on('connect_error', (error) => {
                expect(error.message).toBe('Authentication error');
                done();
            });
        });
    });

    describe('Room Management', () => {
        it('should join user room', (done) => {
            socket.emit('join', testUser._id.toString());

            // Simulate server response
            setTimeout(() => {
                const rooms = socket.rooms;
                expect(rooms).toContain(`user:${testUser._id}`);
                done();
            }, 100);
        });

        it('should leave user room on disconnect', (done) => {
            socket.emit('join', testUser._id.toString());

            setTimeout(() => {
                socket.disconnect();
                const rooms = socket.rooms;
                expect(rooms).not.toContain(`user:${testUser._id}`);
                done();
            }, 100);
        });
    });

    describe('Achievement Updates', () => {
        it('should receive achievement progress updates', (done) => {
            socket.emit('join', testUser._id.toString());

            socket.on('achievementProgress', (data) => {
                expect(data).toHaveProperty('userId', testUser._id.toString());
                expect(data).toHaveProperty('achievementId');
                expect(data).toHaveProperty('progress');
                done();
            });

            // Simulate achievement update
            socket.emit('achievementUpdate', {
                userId: testUser._id.toString(),
                achievementId: 'test-achievement-id',
                progress: 50
            });
        });

        it('should not receive updates for other users', (done) => {
            const otherUserId = 'other-user-id';
            socket.emit('join', otherUserId);

            socket.on('achievementProgress', () => {
                // Should not receive this event
                done(new Error('Received update for wrong user'));
            });

            // Simulate achievement update
            socket.emit('achievementUpdate', {
                userId: testUser._id.toString(),
                achievementId: 'test-achievement-id',
                progress: 50
            });

            // Wait to ensure no event is received
            setTimeout(() => {
                done();
            }, 100);
        });
    });

    describe('Error Handling', () => {
        it('should handle disconnection gracefully', (done) => {
            socket.on('disconnect', () => {
                expect(socket.connected).toBe(false);
                done();
            });

            socket.disconnect();
        });

        it('should handle invalid events gracefully', (done) => {
            socket.on('error', (error) => {
                expect(error).toBeDefined();
                done();
            });

            socket.emit('invalidEvent', {});
        });
    });
}); 