require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const socketIO = require('socket.io');
const http = require('http');

// Import routes
const userRoutes = require('./routes/userRoutes');
const achievementRoutes = require('./routes/achievementRoutes');

// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/achievements', achievementRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('New client connected');

    // Join user's personal room
    socket.on('join', (userId) => {
        socket.join(`user:${userId}`);
    });

    // Handle achievement updates
    socket.on('achievementUpdate', (data) => {
        io.to(`user:${data.userId}`).emit('achievementProgress', data);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 