const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: { origin: "*" },
  pingTimeout: 60000
});

app.get('/', (req, res) => { res.send('🚀 Arena1v1 Server is UP on Render!'); });

let waitingPlayer = null;

io.on('connection', (socket) => {
  socket.on('find_match', () => {
    if (waitingPlayer && waitingPlayer !== socket) {
      const roomId = "room_" + socket.id;
      socket.join(roomId); waitingPlayer.join(roomId);
      io.to(roomId).emit('match_found', { roomId: roomId, isBot: false, startX: 400, startY: 900 });
      waitingPlayer = null;
    } else {
      waitingPlayer = socket;
      setTimeout(() => {
        if (waitingPlayer === socket) {
          socket.emit('match_found', { roomId: "bot_" + socket.id, isBot: true, startX: 400, startY: 900 });
          waitingPlayer = null;
        }
      }, 10000);
    }
  });
  socket.on('player_move', (data) => socket.to(data.roomId).emit('opponent_move', data));
  socket.on('player_shoot', (data) => socket.to(data.roomId).emit('opponent_shoot', data));
  socket.on('disconnect', () => { if (waitingPlayer === socket) waitingPlayer = null; });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
