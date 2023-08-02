import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

const dateFormats = {
  date: 'YYYY-MM-DD',
  min: 'YYYY-MM-DD HH:mm',
  sec: 'YYYY-MM-DD HH:mm:ss',
  timestamp: 'YYYY-MM-DDTHH:mm:ss.000Z',
  zuluTimestamp: 'YYYY-MM-DDTHH:mm:ss.000[Z]',
};
const days = ['일', '월', '화', '수', '목', '금', '토'];

function timeGetter({ date = new Date(), type = 'utc', format = dateFormats.timestamp }): string {
  if (type === 'utc') {
    const formatConvert = format === dateFormats.timestamp ? dateFormats.zuluTimestamp : format;
    return dayjs.utc(date).format(formatConvert);
  }
  return dayjs(date).utcOffset(9).format(format);
}

export default {
  getDate(type = 'utc') {
    return timeGetter({ type, format: dateFormats.date });
  },
  getTime(type = 'utc') {
    return timeGetter({ type, format: dateFormats.sec });
  },
  getTimestamp(type = 'utc') {
    return timeGetter({ type });
  },
  makeDate(date: Date, type = 'utc') {
    return timeGetter({ date, type, format: dateFormats.date });
  },
  makeTime(date: Date, type = 'utc') {
    return timeGetter({ date, type, format: dateFormats.sec });
  },
  makeTimestamp(date: Date, type = 'utc') {
    return timeGetter({ date, type });
  },
  getBeforeDays(day = 7) {
    return dayjs.utc().subtract(day, 'day').toDate();
  },
  getStockLogDate() {
    const now = dayjs(new Date()).utcOffset(9);
    return `${now.format('YYYY-MM-DD')} ${days[now.day()]}요일 ${now.format('HH:mm:ss')}`;
  },
  makeChartDate(dateString: string) {
    const date = dayjs(dateString).utcOffset(9);
    return `${date.format('M/D')} ${days[date.day()]} ${date.format('HH시')}`;
  },
};
