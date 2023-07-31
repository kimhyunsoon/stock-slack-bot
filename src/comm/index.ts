import type http from 'http';
import { Server, type Socket } from 'socket.io';
import { middleware as formMiddleware, type IFormList } from './form-checker';
import { Error } from '../debug/error';
import logger from '../debug/logger';

interface CommConfig {
  port?: number
  server?: http.Server
}

export interface IHandler {
  rules: IFormList
  handler: (socket: Socket, io: Server) => void
}

export class Comm {
  static instance: Comm | undefined;

  static async initialize(config: CommConfig, handlers: IHandler): Promise<void> {
    Comm.instance = new Comm(config, handlers);
  }

  public readonly server: Server;

  private readonly handlers: IHandler;

  constructor(config: CommConfig, handlers: IHandler) {
    this.handlers = handlers;

    if (config.port != null) {
      this.server = new Server(config.port, {
        cors: {
          origin: '*',
        },
      });
    } else if (config.server != null) {
      this.server = new Server(config.server, {
        transports: ['websocket'],
        maxHttpBufferSize: 1e7,
        cors: {
          origin: '*',
        },
      });
    } else {
      throw Error.badRequestArgument();
    }

    this.server.use(formMiddleware(this.handlers.rules));

    this.server.on('connection', (socket: Socket) => {
      logger.info(`New connection: ${socket.id}`);
      this.handlers.handler(socket, this.server);
    });
  }
}

export default {
  initialize: Comm.initialize,
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  getInstance: () => (Comm.instance!),
};
