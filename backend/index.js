const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const rooms = new Map(); 
const randomQueue = [];
const activeRandomPairs = new Map(); 

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create-room', () => {
    const roomId = generateRoomId();
    rooms.set(roomId, {
      hostId: socket.id,
      participants: new Set([socket.id])
    });
    socket.join(roomId);
    socket.emit('room-created', { roomId });
    console.log(`Room created: ${roomId} by ${socket.id}`);
  });

  socket.on('join-room', ({ roomId }) => {
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      room.participants.add(socket.id);
      socket.join(roomId);
      socket.emit('room-joined', { roomId });
      io.to(roomId).emit('user-joined', { userId: socket.id });
      console.log(`User ${socket.id} joined room ${roomId}`);
    } else {
      socket.emit('room-error', { message: 'Room not found' });
    }
  });

  socket.on('leave-room', ({ roomId }) => {
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      room.participants.delete(socket.id);
      socket.leave(roomId);
      io.to(roomId).emit('user-left', { userId: socket.id });
      
      if (room.participants.size === 0) {
        rooms.delete(roomId);
        console.log(`Room ${roomId} deleted`);
      }
    }
  });

  socket.on('room-message', ({ roomId, message, username }) => {
    socket.to(roomId).emit('room-message', {
      message,
      username: username || 'Anonymous',
      userId: socket.id
    });
  });

  socket.on('find-random', () => {
    if (randomQueue.length > 0 && randomQueue[0] !== socket.id) {
      const matchedSocketId = randomQueue.shift();
      
      const index = randomQueue.indexOf(socket.id);
      if (index > -1) {
        randomQueue.splice(index, 1);
      }

      // Create pair
      activeRandomPairs.set(socket.id, matchedSocketId);
      activeRandomPairs.set(matchedSocketId, socket.id);

      socket.emit('random-matched', { matched: true });
      io.to(matchedSocketId).emit('random-matched', { matched: true });

      console.log(`Matched ${socket.id} with ${matchedSocketId}`);
    } else {
      // Add to queue
      if (!randomQueue.includes(socket.id)) {
        randomQueue.push(socket.id);
        socket.emit('waiting-for-match', {});
        console.log(`User ${socket.id} added to queue`);
      }
    }
  });

  socket.on('leave-random', () => {
    const matchedId = activeRandomPairs.get(socket.id);
    if (matchedId) {
      activeRandomPairs.delete(socket.id);
      activeRandomPairs.delete(matchedId);
      io.to(matchedId).emit('partner-left', {});
      console.log(`User ${socket.id} left random chat`);
    }

    // Remove from queue if present
    const index = randomQueue.indexOf(socket.id);
    if (index > -1) {
      randomQueue.splice(index, 1);
    }
  });

  socket.on('random-message', ({ message, username }) => {
    const matchedId = activeRandomPairs.get(socket.id);
    if (matchedId) {
      io.to(matchedId).emit('random-message', {
        message,
        username: username || 'Anonymous',
        userId: socket.id
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // Clean up room-based chat
    for (const [roomId, room] of rooms.entries()) {
      if (room.participants.has(socket.id)) {
        room.participants.delete(socket.id);
        socket.leave(roomId);
        io.to(roomId).emit('user-left', { userId: socket.id });
        
        if (room.participants.size === 0) {
          rooms.delete(roomId);
        }
      }
    }

    // Clean up random chat
    const matchedId = activeRandomPairs.get(socket.id);
    if (matchedId) {
      activeRandomPairs.delete(socket.id);
      activeRandomPairs.delete(matchedId);
      io.to(matchedId).emit('partner-left', {});
    }

    // Remove from queue
    const index = randomQueue.indexOf(socket.id);
    if (index > -1) {
      randomQueue.splice(index, 1);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
