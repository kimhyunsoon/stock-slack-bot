/* eslint-disable @typescript-eslint/no-explicit-any */
import { scheduleJob } from 'node-schedule';
import logger from '../debug/logger';
import ChartJsImage from 'chartjs-to-image';
import path from 'path';
import { Stock } from '../db/stock';
import { StockLog } from '../db/stock-log';
import time from '../util/time';
import { WebClient } from '@slack/web-api';
import { slack } from '../config/config.json';
import { createReadStream } from 'fs';

const colors = ['#36a2eb', '#ff6384', '#4bc0c0', '#ff9f40', '#9966ff'];

interface DatasetlInterface {
  label: string
  data: number[]
  borderColor: string
  backgroundColor: string
  yAxisID: string
}

function chartScheduler(): void {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  scheduleJob('1 7 * * 5', async () => { // utc+9 기준 매주 금요일 16:01에 실행
    try {
      // 차트 데이터
      const items = await Stock.getList({ itemsPerPage: 0, page: 1 });
      const labels: string[] = [];
      const datasets: DatasetlInterface[] = [];
      const yAxes: Array<Record<string, unknown>> = [];
      for (let i = 0; i < items.length; i += 1) {
        const { name, logs } = items[i];
        const dataset: DatasetlInterface = {
          label: name,
          data: [],
          borderColor: colors[i % 5],
          backgroundColor: 'transparent',
          yAxisID: `y${i}`,
        };
        yAxes.push({
          id: `y${i}`,
          type: 'linear',
          display: false,
          position: 'left',
        });
        for (const log of logs) {
          const { price, created } = log;
          dataset.data.push(Number(price));
          if (labels.length < logs.length) labels.push(time.makeChartDate(created));
        }
        datasets.push({
          ...dataset,
        });
      }

      // 차트 생성
      const chart = new ChartJsImage();
      chart.setConfig({
        type: 'line',
        data: {
          labels,
          datasets,
        },
        options: {
          scales: {
            yAxes,
          },
          layout: {
            padding: {
              left: 40,
              right: 40,
            },
          },
          plugins: {
            datalabels: {
              align: 'top',
              color: '#fff',
              font: {
                weight: 'bold',
              },
              backgroundColor: '#00000070',
              borderRadius: 4,
              formatter: (value: number) => `₩ ${value.toLocaleString()}`,
              display: (context: any) => {
                const { dataset: { data }, dataIndex } = context;
                let maxIndex = 0;
                let minIndex = 0;

                for (let i = 1; i < data.length; i++) {
                  if (data[i] > data[maxIndex]) {
                    maxIndex = i;
                  } else if (data[i] < data[minIndex]) {
                    minIndex = i;
                  }
                }
                if (
                  dataIndex === maxIndex ||
                  dataIndex === minIndex
                ) return true;
                return false;
              },
            },
          },
        },
      });
      chart.setWidth(800).setHeight(600).setBackgroundColor('#fff');

      // 파일로 저장
      const outputPath = path.join(__dirname, '../../uploads/chart.png');
      await chart.toFile(outputPath);

      // 슬랙에 발송
      const web = new WebClient(slack.bot_token);
      await web.files.upload({
        channels: slack.channel,
        token: slack.bot_token,
        file: createReadStream(outputPath),
        filename: 'chart.png',
      });
      logger.info(`Send Stock Graph Chart at ${time.getTime('local')}`);

      // 최근 100일 이전의 데이터 삭제
      const { deletedCount } = await StockLog.deleteMany({
        created: { $lt: time.getBeforeDays(100) },
      });

      if (deletedCount > 0) logger.info(`Deleted ${deletedCount} Stock Log entries at ${time.getTime('local')}`);
    } catch (error) {
      logger.error(error);
    }
  });
}

export default chartScheduler;
