import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { setupRoomHandlers, getQueue } from './handlers/roomHandler.js';
import { setupSignalingHandlers } from './handlers/signalingHandler.js';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PulseCare Signaling Server',
    activePatientsInQueue: getQueue().length,
    timestamp: Date.now()
  });
});

// Socket.io connection lifecycle
io.on('connection', (socket) => {
  // Send current queue immediately upon connection
  socket.emit('queue-updated', getQueue());

  // Setup domain handlers
  setupRoomHandlers(io, socket);
  setupSignalingHandlers(io, socket);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`[PulseCare] Signaling Server running on http://localhost:${PORT}`);
});
