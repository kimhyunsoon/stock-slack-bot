/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Socket } from 'socket.io';
import { type IncomingMessage } from 'http';
import { type Request } from 'express';
import useragnt from 'useragent';
import { logs } from '../config/config.json';
import { Error } from '../debug/error';
import { Log } from '../db/log';

function getRequestInfo(request: IncomingMessage | Request): Record<string, any> {
  const ip = 'httpVersion' in request ? request.socket.remoteAddress : (request as Request).ip;
  const userAgent = 'httpVersion' in request ? request.headers['user-agent'] : (request as Request).get('User-Agent');
  if (ip === undefined || userAgent === undefined) throw Error.notFoundData('request-info');
  const agent = useragnt.parse(userAgent);
  return {
    ...((ip != null) && { ip }),
    device: {
      browser: agent.toAgent(),
      os: agent.os.toString(),
    },
  };
}

function socketEventNameChecker(eventName: string): boolean {
  const loggableEventNames: string[] = [...logs.loggableEventNames];
  if (
    eventName.includes('.add') ||
    eventName.includes('.update') ||
    eventName.includes('.reset') ||
    eventName.includes('.delete') ||
    (Boolean(loggableEventNames.includes(eventName)))
  ) return true;
  return false;
}

function removeArrayBuffersProperties(payload: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};

  for (const key in payload) {
    const value = payload[key];
    // ArrayBuffer 타입의 속성은 저장하지 않음
    if (
      !(
        Array.isArray(value) &&
        key === 'data' &&
        value.every((item: unknown) => item instanceof Buffer)
      )
    ) {
      if (Array.isArray(value)) {
        result[key] = value.map((item) => removeArrayBuffersProperties(item));
      } else if (typeof value === 'object') {
        result[key] = removeArrayBuffersProperties(value);
      } else {
        result[key] = value;
      }
    }
  }

  return result;
}

async function addSocketEventLog(socket: Socket, eventName: string, _payload: Record<string, any>): Promise<void> {
  // add, update, reset, delete 혹은 config에서 정의한 이벤트인 경우에만 로그를 기록함
  if (socketEventNameChecker(eventName)) {
    const { request, data: { info: { no: userNo } = { no: null } } = {} } = socket;
    const requestInfo = getRequestInfo(request);
    let targets: null | string[] = null;
    if (_payload._ids?.length > 0) {
      targets = _payload._ids;
    } else if (_payload._id != null) {
      targets = [_payload._id];
    }
    const payload = {
      ...requestInfo,
      action: eventName,
      payload: removeArrayBuffersProperties(_payload), // _payload에서 ArrayBurffer 타입의 속성 제거
      ...((userNo != null) && { userNo }),
      ...((targets != null) && { targets }),
    };

    await Log.add(payload);
  }
}

export {
  addSocketEventLog,
  getRequestInfo,
};
