import cheerio from 'cheerio';
import axios from 'axios';
import logger from '../debug/logger';
import { Error } from '../debug/error';

async function getPresentPrice(code: string): Promise<number> {
  try {
    const html = await axios.get(`https://finance.naver.com/item/main.naver?code=${code}`);
    const $ = cheerio.load(html.data);
    const price = $('#chart_area > div.rate_info > div.today > p.no_today > em').text().replace(/^\s+|\s+$/gm, '').split('\n')[0].replace(',', '');
    return Number(price);
  } catch (error) {
    Error.makeThrow(error);
  }
}

function calculateDiffAndRatio(a:number, b:number): Record<string, number | string> {
  const diff = b - a;
  const ratio = (diff / a) * 100;

  return {
    diff,
    ratio: ratio.toFixed(2),
  };
}

export {
  getPresentPrice,
  calculateDiffAndRatio,
};
