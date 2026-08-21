import { Server as SocketIOServer, Socket } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export function initSockets(server: any, corsOrigin: string) {
  ioInstance = new SocketIOServer(server, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST', 'PATCH', 'DELETE']
    }
  });

  ioInstance.on('connection', (socket: Socket) => {
    console.log(`🔌 WebSocket Client connected: ${socket.id}`);

    // Join room subscriptions
    socket.on('join:room', (room: string) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    socket.on('leave:room', (room: string) => {
      socket.leave(room);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 WebSocket Client disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
}

export function emitEvent(event: string, payload: any, room?: string) {
  if (!ioInstance) return;
  if (room) {
    ioInstance.to(room).emit(event, payload);
  } else {
    ioInstance.emit(event, payload);
  }
}
