import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { setupDebateSocketHandlers } from './debateSocketHandler';

export function initializeSocketServer(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  setupDebateSocketHandlers(io);
  return io;
}
