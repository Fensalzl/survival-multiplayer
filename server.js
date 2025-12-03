const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Statische Dateien (dein Spiel)
app.use(express.static(path.join(__dirname)));

// Gemeinsamer Spielzustand (vereinfacht)
let gameState = {
  resources: {
    holz: 60,
    stein: 40,
    essen: 50,
    wasser: 40,
    medis: 5,
    waffen: 0,
    wolle: 0,
    garn: 0,
    stoff: 0,
    kleidung: 0
  },
  buildings: [],
  citizens: [],
  stats: {
    tag: 1,
    geborene: 0,
    gestorben: 0
  }
};

io.on('connection', (socket) => {
  console.log('Spieler verbunden:', socket.id);

  // aktuellen Zustand an neuen Spieler
  socket.emit('stateUpdate', gameState);
// --- Server: buildRequest empfangen, validieren und broadcasten ---
socket.on('buildRequest', (payload) => {
    console.log('Server: buildRequest von', socket.id, payload);

    // payload: { type }
    const type = payload && payload.type;

    // TODO: füge hier deine Prüfungen ein: Kosten, Platz, Cooldown, gültiger Spieler, etc.
    const allowed = true; // <--- ersetze durch echte Validierung

    if (!type) {
        socket.emit('buildFailed', { reason: 'no_type' });
        return;
    }

    if (!allowed) {
        socket.emit('buildFailed', { reason: 'validation_failed' });
        return;
    }

    // Wenn ok: an alle Clients broadcasten (inkl. dem Sender)
    const result = { playerId: socket.id, type, /* optional: x, y */ };
    io.emit('buildPlaced', result);

    // Optional: Bestätigung an den Sender
    socket.emit('buildOk', result);
});

  // Gebäude-Bau vom Client
  socket.on('buildRequest', (data) => {
    const type = data.type;
    if (!type) return;

    // Einfaches Gebäudeobjekt
    const building = {
      id: Date.now(),
      type,
      name: type,
      residents: [],
      workers: [],
      health: 100,
      maxHealth: 100,
      status: 'open'
    };

    gameState.buildings.push(building);

    // State an alle Clients senden
    io.emit('stateUpdate', gameState);
    console.log('Gebäude gebaut:', type);
  });

  socket.on('disconnect', () => {
    console.log('Spieler getrennt:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('Server läuft auf Port', PORT);
});
