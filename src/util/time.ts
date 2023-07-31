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

function timeGetter({ date = new Date(), type = 'utc', format = dateFormats.timestamp }): string {
  if (type === 'utc') {
    const formatConvert = format === dateFormats.timestamp ? dateFormats.zuluTimestamp : format;
    return dayjs.utc(date).format(formatConvert);
  }
  return dayjs(date).format(format);
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
};
