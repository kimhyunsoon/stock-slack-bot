/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Socket } from 'socket.io';
import { addSocketEventLog, getRequestInfo } from '../util/log';
import logger from '../debug/logger';

export function makeHandler(
  socket: Socket,
  eventName: string,
  callback: (...args: any[]) => Promise<void>,
): void {
  socket.on(eventName, async (payload, response) => {
    try {
      await addSocketEventLog(socket, eventName, payload);
      await callback(payload, response);
    } catch (error: any) {
      const { ip, device: { browser, os } } = getRequestInfo(socket.request);
      logger.error({
        ...error,
        meta: {
          scope: 'socket',
          eventName,
          ip,
          browser,
          os,
        },
      });
      response(error);
    }
  });
}
