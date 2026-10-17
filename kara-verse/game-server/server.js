require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const redis = require('redis');

const app = express();
app.use(require('cors')());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// Connect to Redis
const redisClient = redis.createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
redisClient.connect().catch(console.error);

const PORT = process.env.PORT || 4001;

// Store player states in memory (synced to Redis periodically)
const players = {};

io.on('connection', (socket) => {
  console.log(`?? Player connected: ${socket.id}`);

  // Player joins the city
  socket.on('player_join', (data) => {
    players[socket.id] = {
      id: socket.id,
      x: data.x || 0,
      y: data.y || 0,
      z: data.z || 0,
      name: data.name || 'Anonymous',
      color: data.color || '#00ff00'
    };
    
    // Broadcast new player to everyone
    io.emit('player_joined', players[socket.id]);
    // Send existing players to the new joiner
    socket.emit('current_players', Object.values(players));
  });

  // Player moves
  socket.on('player_move', (data) => {
    if (players[socket.id]) {
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;
      players[socket.id].z = data.z;
      
      // Broadcast movement to all other players
      socket.broadcast.emit('player_moved', players[socket.id]);
    }
  });

  // Player chat (To be wired to Ollama/Qwen AI later)
  socket.on('chat_message', (data) => {
    io.emit('chat_message', {
      id: socket.id,
      name: players[socket.id]?.name || 'Anonymous',
      message: data.message,
      timestamp: Date.now()
    });
  });

  socket.on('disconnect', () => {
    console.log(`?? Player disconnected: ${socket.id}`);
    const player = players[socket.id];
    if (player) {
      io.emit('player_left', socket.id);
      delete players[socket.id];
    }
  });
});

server.listen(PORT, () => {
  console.log(`?? KaraVerse Game Server running on port ${PORT}`);
  console.log(`?? Redis connected: ${redisClient.isReady}`);
});
