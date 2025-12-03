const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static('.'));

let gameState = {
  resources: { holz: 60, stein: 40, essen: 50 },
  buildings: [{ id: 1, type: "zelt", name: "Zelt" }],
  citizens: [{ id: 1, name: "Erik" }]
};

io.on('connection', (socket) => {
  socket.emit('stateUpdate', gameState);
  
  socket.on('buildRequest', (data) => {
    gameState.buildings.push({ id: Date.now(), type: data.type });
    io.emit('stateUpdate', gameState);
  });
});

server.listen(process.env.PORT || 3000);
