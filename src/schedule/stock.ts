import { scheduleJob } from 'node-schedule';
import { WebClient } from '@slack/web-api';
import { slack } from '../config/config.json';
import time from '../util/time';
import logger from '../debug/logger';
import { Stock } from '../db/stock';
import { StockLog } from '../db/stock-log';
import { getPresentPrice, calculateDiffAndRatio } from '../util/stock';

function stockScheduler(): void {
  // utc+9 기준 월-금 9시-16시 정각에 실행
  for (let i = 9; i <= 16; i++) {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    scheduleJob({ hour: i, minute: 0, tz: 'Etc/GMT-9' }, async () => {
      try {
        const items = await Stock.find({ disable: false });
        let msg = ''; // 슬랙 메시지
        let totalBuyingPrice = 0; // 매입총액
        let totalPresentPrice = 0; // 평가총액
        for (const item of items) {
          const { code, name, average, count } = item;

          // 현재가 크롤링
          const price = await getPresentPrice(code);

          // 평단-현재가 증감율
          const { ratio } = calculateDiffAndRatio(average, price);

          totalBuyingPrice += average * count;
          totalPresentPrice += price * count;

          // 최근 7일 시장평균가격
          const beforeAverage = await StockLog.getAveragePriceAfterDate({ date: time.getBeforeDays(), code });

          // 최근 7일 시장평균가격-현재가 증감율
          const { ratio: beforeRatio } = calculateDiffAndRatio(beforeAverage, price);

          // 현재가 저장
          await StockLog.add([{ code, price }]);

          // 종목별 메시지 작성
          msg += '\n---------------------------------------\n\n';
          msg += `  *${String(name)}* [${String(count)}]\n`;
          msg += `\n  현재가: ${Number(price).toLocaleString()}원 *${beforeRatio}%*\n`;
          msg += `  평균단가: ${Number(average).toLocaleString()}원\n`;
          msg += `  매입금액: ${(average * count).toLocaleString()}원\n`;
          msg += `  평가손익: ${((price - average) * count).toLocaleString()}원 *${ratio}%*\n`;
        }

        // 총 평가손익 계산
        const { ratio: totalRatio } = calculateDiffAndRatio(totalBuyingPrice, totalPresentPrice);

        // 종목총합 메시지 작성
        msg += '\n---------------------------------------\n\n';
        msg += `  매입총액: ${totalBuyingPrice.toLocaleString()}원\n`;
        msg += `  평가총액: ${totalPresentPrice.toLocaleString()}원\n`;
        msg += `  평가손익: ${((totalPresentPrice - totalBuyingPrice)).toLocaleString()}원 *${totalRatio}%*\n`;
        msg += '\n---------------------------------------\n\n';
        msg += `  \`${time.getStockLogDate()}\`\n`;

        // 슬랙 메시지 발송
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
