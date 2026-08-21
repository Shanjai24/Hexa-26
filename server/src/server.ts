import http from 'http';
import app from './app.js';
import { config } from './config/index.js';
import { initSockets } from './sockets/socketHandler.js';

const server = http.createServer(app);

initSockets(server, config.corsOrigin);

server.listen(config.port, () => {
  console.log(`🚀 CivicSense AI Server listening on http://localhost:${config.port}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🏥 Health check: http://localhost:${config.port}/api/health`);
});
