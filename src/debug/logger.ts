import pino from 'pino';
import { logs } from '../config/config.json';
import dayjs from 'dayjs';
import fs from 'fs';

const path = logs.path;

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

function writeLogToFile(log: unknown): void {
  const time = `[${dayjs().format('HH:mm:ss.SSS')}]`;
  const logString = typeof log === 'string' ? `${log}\n` : `${JSON.stringify(log)}\n`;
  const newLine = `${time} ${logString}`;

  const currentPath = `${path}/${dayjs().format('YYYYMMDD')}.log`;
  const fileExists = fs.existsSync(currentPath);

  if (!fileExists) {
    fs.writeFileSync(currentPath, newLine);
  } else {
    fs.appendFileSync(currentPath, newLine);
  }
}
export default {
  info(log: unknown): void {
    logger.info(log);
  },
  error(log: unknown): void {
    logger.error(log);
    writeLogToFile(log);
  },
  fatal(log: unknown): void {
    logger.fatal(log);
    writeLogToFile(log);
  },
};
