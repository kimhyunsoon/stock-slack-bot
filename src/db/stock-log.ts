/* eslint-disable @typescript-eslint/no-explicit-any */
import { Schema, model, type Model, Types } from 'mongoose';
import { Error } from '../debug/error';
import db from '.';
import { payloadToListQuery, payloadToSummaryQuery } from './helper';

interface StockLogInterface {
  code: string
  price: number
  created: Date
}

interface StockLogModel extends Model<StockLogInterface> {
  add: (_payload: Array<Record<string, unknown>>) => Promise<Record<string, unknown>>
  update: (_payload: Record<string, any>) => Promise<Record<string, unknown>>
  delete: (_payload: Array<Record<string, unknown>>) => Promise<Record<string, unknown>>
  get: (_payload: Record<string, string>) => Promise<Record<string, unknown>>
  getSummary: (_payload: Record<string, unknown>) => Promise<Record<string, unknown>>
  getList: (_payload: Record<string, unknown>) => Promise<Record<string, unknown>>
  getAveragePriceAfterDate: (_payload: Record<string, any>) => Promise<number>
}

const stockLogSchema = new Schema<StockLogInterface, StockLogModel>({
  code: { type: String, required: true, ref: 'Stock' },
  price: { type: Number, required: true },
  created: { type: Date, default: Date.now },
});

stockLogSchema.static('add', async (_payload: Array<Record<string, unknown>>): Promise<Record<string, unknown>> => {
  try {
    let result;
    await db.getInstance().transaction(async (session) => {
      const collection = model('StockLog');
      result = await db.getInstance().create(collection, _payload, session);
    });
    return JSON.parse(JSON.stringify(result));
  } catch (error: unknown) {
    Error.makeThrow(error, 'crud');
  }
});

stockLogSchema.static('update', async (_payload: Record<string, any>): Promise<Record<string, unknown>> => {
  try {
    let result;
    await db.getInstance().transaction(async (session) => {
      const collection = model('StockLog');
      result = await db.getInstance().update(collection, _payload, session);
      if (result == null) throw Error.notFoundData('area-update');
    });
    return JSON.parse(JSON.stringify(result));
  } catch (error: unknown) {
    Error.makeThrow(error, 'crud');
  }
});

stockLogSchema.static('delete', async (_payload: Array<Record<string, unknown>>): Promise<Record<string, unknown>> => {
  try {
    let result;
    await db.getInstance().transaction(async (session) => {
      const collection = model('StockLog');
      result = await db.getInstance().update(collection, {
        _ids: _payload,
        disable: true,
      }, session);
      if (result == null) throw Error.notFoundData('area-delete');
    });
    return JSON.parse(JSON.stringify(result));
  } catch (error: unknown) {
    Error.makeThrow(error, 'crud');
  }
});

stockLogSchema.static('get', async (_payload: Record<string, string>): Promise<Record<string, unknown>> => {
  try {
    const collection = model('StockLog');
    const [document] = await collection
      .aggregate([
        // 파이프라인 작성
        {
          $match: {
            _id: new Types.ObjectId(_payload._id),
            disable: false,
          },
        },
        {
          $project: {
            disable: 0,
          },
        },
      ]);
    if (document == null) throw Error.notFoundData('area-get');
    return JSON.parse(JSON.stringify(document));
  } catch (error: unknown) {
    Error.makeThrow(error, 'crud');
  }
});

stockLogSchema.static('getSummary', async (_payload: Record<string, unknown>): Promise<Record<string, unknown>> => {
  try {
    const collection = model('StockLog');
    const qurey = payloadToSummaryQuery([
      // 파이프라인 작성
    ], _payload);
    const result = await collection.aggregate(qurey);
    if (result.length <= 0) {
      return {
        total: 0,
      };
    }
    return JSON.parse(JSON.stringify(result[0]));
  } catch (error: unknown) {
    Error.makeThrow(error, 'crud');
  }
});

stockLogSchema.static('getList', async (_payload: Record<string, unknown>): Promise<Record<string, unknown>> => {
  try {
    const collection = model('StockLog');
    const query = payloadToListQuery([
      // 파이프라인 작성
    ], _payload);
    const result = await collection.aggregate([
      ...query,
      {
        $project: {
          disable: 0,
        },
      },
    ]);
    return JSON.parse(JSON.stringify(result));
  } catch (error: unknown) {
    Error.makeThrow(error, 'crud');
  }
});

stockLogSchema.static('getAveragePriceAfterDate', async (_payload: Record<string, any>): Promise<number> => {
  try {
    const collection = model('StockLog');
    const { date, code } = _payload;
    const result = await collection.aggregate([
      {
        $match: { created: { $gt: date }, code },
      },
      {
        $group: {
          _id: null,
          averagePrice: { $avg: '$price' },
        },
      },
    ]);
    return result[0]?.averagePrice | 0;
  } catch (error: unknown) {
    Error.makeThrow(error, 'crud');
  }
});

const StockLog = model<StockLogInterface, StockLogModel>('StockLog', stockLogSchema);

export { StockLog };
