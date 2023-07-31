import { type Socket, type Server } from 'socket.io';
import { type IHandler } from '../comm';

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export default {
  rules: {
    // ...sample.rules,
  },
  handler(socket: Socket, io: Server) {
    // void sample.handler(io, socket);
  },
} as IHandler;
