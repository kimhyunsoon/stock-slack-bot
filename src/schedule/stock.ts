import { scheduleJob } from 'node-schedule';
import { WebClient } from '@slack/web-api';
import { slack } from '../config/config.json';
import time from '../util/time';
import logger from '../debug/logger';
import { Stock } from '../db/stock';
import { StockLog } from '../db/stock-log';
import { getPresentPrice, calculateDiffAndRatio } from '../util/stock';

function stockScheduler(): void {
  for (let i = 9; i <= 16; i++) {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    scheduleJob({ hour: i, minute: 0, tz: 'Etc/GMT-9' }, async () => {
      try {
        const items = await Stock.getList({
          itemsPerPage: 0,
          page: 1,
        });
        let msg = '';
        let totalBuyingPrice = 0;
        let totalPresentPrice = 0;
        for (const index in items) {
          const { code, name, average, count } = items[index];
          const price = await getPresentPrice(code);
          const { ratio } = calculateDiffAndRatio(average, price);
          totalBuyingPrice += average * count;
          totalPresentPrice += price * count;
          await StockLog.add([{ code, price }]);
          const beforeAverage = await StockLog.getAveragePriceAfterDate({ date: time.getBeforeDays(), code });
          const { ratio: beforeRatio } = calculateDiffAndRatio(beforeAverage, price);
          msg += '\n---------------------------------------\n\n';
          msg += `  *${String(name)}* [${String(count)}]\n`;
          msg += `\n  현재가: ${Number(price).toLocaleString()}원 *${beforeRatio}%*\n`;
          msg += `  평균단가: ${Number(average).toLocaleString()}원\n`;
          msg += `  매입금액: ${(average * count).toLocaleString()}원\n`;
          msg += `  평가손익: ${((price - average) * count).toLocaleString()}원 *${ratio}%*\n`;
        }
        const { ratio: totalRatio } = calculateDiffAndRatio(totalBuyingPrice, totalPresentPrice);
        msg += '\n---------------------------------------\n\n';
        msg += `  매입금액: ${totalBuyingPrice.toLocaleString()}원\n`;
        msg += `  평가금액: ${totalPresentPrice.toLocaleString()}원\n`;
        msg += `  평가금액: ${((totalPresentPrice - totalBuyingPrice)).toLocaleString()}원 *${totalRatio}%*\n`;
        msg += '\n---------------------------------------\n\n';
        msg += `  \`${time.getStockLogDate()}\`\n`;
        const web = new WebClient(slack.bot_token);
        await web.chat.postMessage({
          channel: slack.channel,
          text: msg,
          as_user: true,
        });
        logger.info(`Send Stock Data at ${time.getTime('local')}`);
      } catch (error) {
        logger.error(error);
      }
    });
  }
}

export default stockScheduler;
