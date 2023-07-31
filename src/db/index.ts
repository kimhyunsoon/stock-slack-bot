import mongoose, { type Model, type ClientSession, type Mongoose } from 'mongoose';
import { Error } from '../debug/error';
import { type UpdateResult } from 'mongodb';

interface DBConfig {
  host: string
  port: number
  user?: string
  password?: string
  database: string
  options?: Record<string, unknown>
}

function makeMongodbURL({ host, port, user, password, database }: DBConfig): string {
  const auth: string = user != null && password != null ? `${user}:${password}@` : '';
  return `mongodb://${auth}${host}:${port}/${database}?authMechanism=DEFAULT&authSource=${database}`;
}

export class Database {
  static instance: Database | undefined;

  static async initialize(config: DBConfig): Promise<void> {
    Database.instance = new Database();
    await Database.instance.checkConnection(config);
  }

  readonly mongoose: Mongoose;

  constructor() {
    this.mongoose = mongoose;
  }

  private async checkConnection(config: DBConfig): Promise<void> {
    const options = config.options != null ? config.options : {};
    try {
      await this.mongoose.connect(makeMongodbURL(config), options);
    } catch (error) {
      Error.makeThrow(error, 'checkConnection');
    }
  }

  public async transaction(callback: (session: ClientSession) => Promise<void>): Promise<void> {
    let session: null | ClientSession = null;
    try {
      session = await mongoose.startSession();
      session.startTransaction();

      await callback(session); // 콜백함수 실행

      await session.commitTransaction();
    } catch (error: unknown) {
      await session?.abortTransaction();
      await session?.endSession();
      Error.makeThrow(error, 'transaction');
    } finally {
      await session?.endSession();
    }
  }

  public async create(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    collection: Model<any>,
    payload: Array<Record<string, unknown>>,
    session: ClientSession | null = null, // transaction은 optional
  ): Promise<string[]> {
    if (session === null) { // transaction이 아닌 경우 벌크로 실행
      const inserts = await collection.create(payload);
      const result = inserts.map((insert: Record<string, string>) => insert._id);
      if (result.length <= 0) throw Error.notFoundData(`create-${collection.name}`);
      return result;
    }
    const result: string[] = [];
    for (const row of payload) {
      const [insert] = await collection.create([row], { session });
      result.push(insert._id);
    }
    if (result.length <= 0) throw Error.notFoundData(`create-${collection.name}`);
    return result;
  }

  public async update(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    collection: Model<any>,
    payload: Record<string, unknown>,
    session: ClientSession | null = null, // transaction은 optional
  ): Promise<UpdateResult<mongoose.mongo.BSON.Document>> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { _ids, ...data } = payload;
    if (session === null) { // transaction이 아닌 경우
      const result = await collection
        .updateMany({
          _id: { $in: _ids },
        }, {
          $set: {
            ...data,
            updated: new Date(),
          },
        });
      return result;
    }
    const result = await collection
      .updateMany({
        _id: { $in: _ids },
      }, {
        $set: {
          ...data,
          updated: new Date(),
        },
      }, { session });
    return result;
  }

  public async updateOne(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    collection: Model<any>,
    payload: Record<string, unknown>,
    session: ClientSession | null = null, // transaction은 optional
  ): Promise<UpdateResult<mongoose.mongo.BSON.Document>> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { _id, ...data } = payload;
    if (session === null) { // transaction이 아닌 경우
      const result = await collection
        .updateOne({
          _id,
        }, {
          $set: {
            ...data,
            updated: new Date(),
          },
        });
      return result;
    }
    const result = await collection
      .updateOne({
        _id,
      }, {
        $set: {
          ...data,
          updated: new Date(),
        },
      }, { session });
    return result;
  }
}

export default {
  initialize: Database.initialize,
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  getInstance: () => (Database.instance!),
};
