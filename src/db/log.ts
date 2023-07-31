/* eslint-disable @typescript-eslint/no-explicit-any */
import { Schema, model, type Model, type ClientSession } from 'mongoose';
import db from '.';

interface LogInterface {
  ip: string
  device: object
  action: string
  payload?: object
  targets?: Schema.Types.ObjectId[]
  meta?: object
  userNo?: number
  created: Date
}

interface LogModel extends Model<LogInterface> {
  add: (_payload: Record<string, unknown>, session?: ClientSession) => Promise<void>
}

const logSchema = new Schema<LogInterface, LogModel>({
  ip: { type: String, required: true },
  device: { type: Object, required: true }, // 디바이스 정보
  action: { type: String, required: true }, // restful api 경로 혹은 socket eventName
  payload: { type: Object, default: undefined }, // 요청 값
  targets: { type: [Schema.Types.ObjectId], default: undefined }, // 대상 _ids (단일 수정도 [_id])
  userNo: { type: Number, default: undefined, ref: 'User' },
  meta: { type: Object, default: undefined }, // 그외 정보
  created: { type: Date, required: true, default: Date.now },
});

logSchema.static('add', async (_payload: Record<string, unknown>, session?: ClientSession): Promise<void> => {
  const collection = model('Log');
  await db.getInstance().create(collection, [_payload], session);
});

const Log = model<LogInterface, LogModel>('Log', logSchema);

export {
  Log,
  type LogInterface,
};
