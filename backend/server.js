const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Adjust for production
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nexus')
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/documents', require('./routes/documents'));

// WebRTC Signaling via Socket.IO
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join a room for video call
    socket.on('join-call-room', (roomId) => {
        console.log(`Socket ${socket.id} joining room ${roomId}`);
        socket.join(roomId);
    });

    socket.on('call-ready', (roomId) => {
        console.log(`Socket ${socket.id} is ready in room ${roomId}. Emitting user-joined`);
        // Tell others in the room that a user is ready
        socket.to(roomId).emit('user-joined');
    });

    // WebRTC Signaling
    socket.on('offer', (payload) => {
        console.log(`Relaying offer to room ${payload.roomId}`);
        socket.to(payload.roomId).emit('offer', payload);
    });

    socket.on('answer', (payload) => {
        console.log(`Relaying answer to room ${payload.roomId}`);
        socket.to(payload.roomId).emit('answer', payload);
    });

    socket.on('ice-candidate', (payload) => {
        socket.to(payload.roomId).emit('ice-candidate', payload);
    });

    // Toggle Audio/Video
    socket.on('toggle-audio', (roomId, userId, isMuted) => {
        socket.to(roomId).emit('user-toggled-audio', userId, isMuted);
    });

    socket.on('toggle-video', (roomId, userId, isHidden) => {
        socket.to(roomId).emit('user-toggled-video', userId, isHidden);
    });

    // Leave Room
    socket.on('leave-room', (roomId, userId) => {
        socket.leave(roomId);
        socket.to(roomId).emit('user-left', userId);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
