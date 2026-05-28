import { Server as SocketIOServer } from 'socket.io';
import http from 'http';

let io: SocketIOServer | null = null;

export const initializeWebSocket = (server: http.Server): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*', // Allow all origins for dev; can restrict to config.FRONTEND_URL
      methods: ['GET', 'POST'],
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Listen for room joining requests
    socket.on('join:assignment', (assignmentId: string) => {
      if (assignmentId) {
        socket.join(`assignment:${assignmentId}`);
        console.log(`Socket ${socket.id} joined room: assignment:${assignmentId}`);
      }
    });

    // Listen for leaving rooms
    socket.on('leave:assignment', (assignmentId: string) => {
      if (assignmentId) {
        socket.leave(`assignment:${assignmentId}`);
        console.log(`Socket ${socket.id} left room: assignment:${assignmentId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const emitAssignmentUpdate = (assignmentId: string, event: string, data: any): void => {
  if (!io) {
    console.warn(`WebSocket is not initialized. Cannot broadcast update for assignment ${assignmentId}`);
    return;
  }
  console.log(`Broadcasting event "${event}" to assignment:${assignmentId}`, data);
  io.to(`assignment:${assignmentId}`).emit(event, data);
};
export default emitAssignmentUpdate;
