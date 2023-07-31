/* eslint-disable @typescript-eslint/no-explicit-any */
import logger from '../debug/logger';

interface ErrorInfo {
  result?: string
  code?: string
  name?: string
  message?: string
  meta?: Record<string, unknown>
}

export class Error {
  result = 'error';

  code = '-1';

  name = 'ERROR';

  message = 'ERROR';

  meta;

  constructor(error: unknown) {
    const info = error as ErrorInfo;

    this.result = (info.result != null) ? info.result : 'error';
    this.code = (info.code != null) ? info.code : '500';
    this.name = (info.name != null) ? info.name : 'SERVER_ERROR';
    this.message = (info.message != null) ? info.message : 'ERROR';
    this.meta = (info.meta != null) ? info.meta : null;
  }

  toString(): string {
    return JSON.stringify({
      result: this.result,
      code: this.code,
      name: this.name,
      message: this.message,
    });
  }

  public static makeError(error: unknown): Error {
    return new Error(error);
  }

  public static makeThrow(error: any, scope?: string): never {
    logger.error({
      ...error,
      ...((scope != null) && {
        meta: {
          ...error.meta,
          scope,
        },
      }),
    });
    throw new Error(error);
  }

  public static internalServerError(): Error {
    return this.makeError({
      code: 500,
      name: 'SERVER_ERROR',
      message: 'Generic error occurred on the server.',
    });
  }

  public static unauthorized(hint?: string): Error {
    const message = hint == null ? 'Unable to validate request.' : `Unable to validate request.(${hint})`;
    return this.makeError({
      code: 401,
      name: 'REQUEST_REJECTED',
      message,
    });
  }

  public static forbidden(hint?: string): Error {
    const message = hint == null ? 'Unable to respond because not have permission.' : `Unable to respond because not have permission.(${hint})`;
    return this.makeError({
      code: 403,
      name: 'ACCESS_DENINED',
      message,
    });
  }

  public static duplicateValue(hint?: string): Error {
    const message = hint == null ? 'Duplicate value. Cannot insert duplicate entries.' : `Duplicate value. Cannot insert duplicate entries.(${hint})`;
    return this.makeError({
      code: 400,
      name: 'DUPLICATE_VALUE',
      message,
    });
  }

  public static badRequestArgument(hint?: string): Error {
    const message = hint == null ? 'Invalid request. Check the argument.' : `Invalid request. Check the argument.(${hint})`;
    return this.makeError({
      code: 400,
      name: 'BAD_REQUEST',
      message,
    });
  }

  public static notFoundData(hint?: string): Error {
    const message = hint == null ? 'Data does not exist.' : `Data does not exist.(${hint})`;
    return this.makeError({
      result: 'error',
      code: 404,
      name: 'NON_EXISTENT_DATA',
      message,
    });
  }

  public static expired(hint?: string): Error {
    const message = hint == null ? 'The expiration date has expired.' : `The expiration date has expired.(${hint})`;
    return this.makeError({
      code: 403,
      name: 'EXPIRED',
      message,
    });
  }

  public static tooManyRequests(hint?: string): Error {
    const message = hint == null ? 'Request frequency too high.' : `Request frequency too high.(${hint})`;
    return this.makeError({
      code: 429,
      name: 'TOO_MANY_REQUESTS',
      message,
    });
  }
}
