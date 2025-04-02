import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

// Create server
const httpServer = createServer();

// Set up Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Near the top of the file, add this console log
console.log("JWT_SECRET for verification:", process.env.JWT_SECRET ? "Available (first few chars: " + process.env.JWT_SECRET.substring(0, 3) + "...)" : "MISSING!");

// Debug environment variable
console.log("Environment:", process.env.NODE_ENV);
console.log("JWT_SECRET available:", !!process.env.JWT_SECRET);

// Near the top of server.js for debugging
const testToken = jwt.sign(
  { userId: 'test123', username: 'Tester' },
  process.env.JWT_SECRET || 'fallbacksecret',
  { expiresIn: '1h' }
);
console.log("Test token generated:", testToken);

// Authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    console.log("No token provided in socket connection");
    return next(new Error('Authentication error: Token not provided'));
  }
  
  try {
    console.log("Verifying token:", token.substring(0, 20) + "...");
    // Use a consistent secret - make sure this matches what's used to create the token
    const secret = process.env.JWT_SECRET || 'fallbacksecret';
    console.log("Using secret starting with:", secret.substring(0, 3) + "...");
    
    const decoded = jwt.verify(token, secret);
    console.log("Decoded token:", decoded);
    socket.data.userId = decoded.userId;
    socket.data.username = decoded.username || 'User';
    console.log(`User authenticated: ${socket.data.userId}`);
    return next();
  } catch (err) {
    console.error("Token verification failed:", err.message, err.stack);
    return next(new Error(`Authentication error: ${err.message}`));
  }
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Handle joining a room
  socket.on('joinRoom', ({ roomId }) => {
    console.log(`User joined room: ${roomId}`);
    socket.join(roomId);
  });
  
  // Handle leaving a room
  socket.on('leaveRoom', ({ roomId }) => {
    console.log(`User left room: ${roomId}`);
    socket.leave(roomId);
  });
  
  // Handle broadcasting messages (after saving to database)
  socket.on('broadcastMessage', ({ roomId, message }) => {
    if (!roomId || !message) {
      console.error('Invalid broadcastMessage data:', { roomId, message });
      return;
    }
    
    console.log(`📢 Broadcasting message to room ${roomId}:`, message.id);
    
    console.log('Message:', message);
    // Broadcast the message to ALL clients in the room (including sender)
    io.to(roomId).emit('newMessage', message);
  });

  // Simple typing handler
  socket.on('typing', (data) => {
    const { roomId, user, isTyping } = data;
    console.log(`${user.username} is ${isTyping ? 'typing' : 'stopped typing'} in room ${roomId}`);
    
    // Broadcast to everyone in the room except sender
    socket.to(roomId).emit('userTyping', {
      user,
      isTyping
    });
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

httpServer.listen(5000, () => {
  console.log('🚀 WebSocket server is running on port 5000');
}); 