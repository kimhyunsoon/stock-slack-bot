/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { type Socket, type Event } from 'socket.io';
import logger from '../debug/logger';

type ValueType = string | number | Record<string, unknown> | ValueType[] | boolean;
type FormType = 'string' | 'number' | 'object' | 'array' | 'boolean' | 'binary';

export interface IRule {
  type: FormType
  minLen?: number
  maxLen?: number
  min?: number
  max?: number
  allow?: Array<string | number>
  required?: boolean
  children?: IForm
  childrenRule?: IRule
}

export type IForm = Record<string, IRule>;

export type IFormList = Record<string, IForm>;

export function checkForm(data: Record<string, unknown>, form: IForm): boolean {
  let confirm = true;

  Object.entries(form).forEach(([key, rule]) => {
    const value = data == null ? null : data[key] as ValueType;

    if (!confirm) {
      // Do nothing
    } else if (value == null) {
      confirm = (rule.required != null) && !rule.required;
    } else {
      const type = typeof value;
      if (rule.type === 'array') {
        const valueArray = data[key] as ValueType[];
        if (confirm && rule.maxLen != null) {
          confirm = (valueArray.length <= rule.maxLen);
        }

        if (confirm && rule.minLen != null) {
          confirm = (valueArray.length >= rule.minLen);
        }
      }

      if (type === 'object' &&
        (rule.type === 'array') &&
        !(value instanceof Array)) {
        confirm = false;
      } else if (type === 'object' &&
        (rule.type === 'binary') &&
        !(value instanceof Uint8Array)) {
        confirm = false;
      } else if (type !== 'object' &&
        type !== rule.type) {
        confirm = false;
      }

      if (typeof value === 'string') {
        if (confirm && rule.maxLen != null) {
          confirm = (value.length <= rule.maxLen);
        }

        if (confirm && rule.minLen != null) {
          confirm = (value.length >= rule.minLen);
        }
      }

      if (typeof value === 'number') {
        // 숫자 최대 범위 확인
        if (confirm && rule.max != null) {
          confirm = (value <= rule.max);
        }

        // 숫자 최소 범위 확인
        if (confirm && rule.min != null) {
          confirm = (value >= rule.min);
        }
      }

      // 허용 값 확인
      if (confirm && rule.allow != null) {
        confirm = (rule.allow.find(item => item === data[key]) != null);
      }

      if (confirm &&
        typeof value === 'object' &&
        rule.children != null &&
        !(value instanceof Array)) {
        confirm = checkForm(value, rule.children);
      }

      if (confirm &&
        typeof value === 'object' &&
        value instanceof Array &&
        rule.childrenRule != null) {
        value.forEach((val) => {
          confirm = confirm && checkForm({ temp: val }, { temp: rule.childrenRule! });
        });
      }

      if (confirm &&
        typeof value === 'object' &&
        rule.children != null) {
        if (value instanceof Array) {
          // Array 일 때의 checkForm 처리
          value.forEach((val) => {
            confirm = confirm && checkForm(val as Record<string, unknown>, rule.children!);
          });
        } else if (value instanceof Uint8Array) {
          // binary 일 경우 아무것도 하지 않음
        } else {
          // Object 일 때의 checkForm 처리
          confirm = checkForm(value, rule.children);
        }
      }
    }
  });

  return confirm;
}

function doCheckForm(socket: Socket, forms: Record<string, IForm>): void {
  socket.use((packet: Event, next: (error?: Error) => void) => {
    const [name, data, response] = packet;
    let confirm: boolean;

    if (response == null) {
      confirm = false;
    } else if (forms[name] != null) {
      confirm = checkForm(data, forms[name]);
    } else {
      confirm = false;
    }

    if (confirm) {
      next();
    } else if (response == null) {
      const error = {
        name: 'BAD_REQUEST',
        message: 'Missing response callback function.',
      };
      logger.error(error);
      next(error);
    } else {
      const error = {
        result: 'error',
        name: 'BAD_REQUEST',
        code: 400,
        message: `Invalid request. Check the argument.(${String(name)})`,
      };
      logger.error(error);
      response(error);
    }
  });
}

export const listRulePreset: IForm = {
  page: { type: 'number', min: 1 },
  itemsPerPage: { type: 'number', min: 0, max: 255 },
  sortBy: { type: 'array', required: false },
  sortDesc: { type: 'array', required: false },
  filters: { type: 'array', required: false },
};

export const summaryRulePreset: IForm = {
  filters: { type: 'array', required: false },
};

export const getRulePreset: IForm = {
  _id: { type: 'string', minLen: 24, maxLen: 24 },
};

export const updateRulePreset: IForm = {
  _ids: {
    type: 'array',
    children: {
      _id: { type: 'string' },
    },
  },
};

export function middleware(forms: IFormList): (socket: Socket, next: (err?: Error) => void) => void {
  return (socket, next): void => {
    doCheckForm(socket, forms);
    next();
  };
}
