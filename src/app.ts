import config from './config/config.json';
import web from './web';
import db from './db';
import comm from './comm';
import socketHandler from './socket';
import events from './event';
import schedule from './schedule';
import logger from './debug/logger';

void (async () => {
  try {
    web.initialize(config.comm);
    logger.info('Web initialized');

    await db.initialize(config.db);
    logger.info('DB initialized');

    await comm.initialize({
      server: web.getInstance(),
    }, socketHandler);
    logger.info('Comm initialized');

    schedule.initialize();
    logger.info('Schedule initialized');

    events.emit('initialized');
  } catch (error) {
    events.emit('error', error);
  }
})();

events.once('initialized', () => {
  logger.info('All systems nominal');
});

events.once('error', (error) => {
  logger.fatal('We got some problem!');
  logger.fatal(error);
  process.exit(-1);
});
