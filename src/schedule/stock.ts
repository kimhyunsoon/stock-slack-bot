import { scheduleJob } from 'node-schedule';
import time from '../util/time';
import logger from '../debug/logger';
import { Stock } from '../db/stock';

function stockScheduler(): void {
  // TODO: i = 8; i <= 17, minute: 59;
  for (let i = 8; i <= 18; i++) {
    for (let j = 0; j < 60; j += 10) {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      scheduleJob({ hour: i, second: j, tz: 'Etc/GMT-9' }, async () => {
        logger.info(`Crawling at ${time.getTime('local')}`);
        try {
          const items = await Stock.getList({
            itemsPerPage: 0,
            page: 1,
          });
          console.log(items);
        } catch (error) {
          logger.error(error);
        }
      });
    }
  }
}

export default stockScheduler;
