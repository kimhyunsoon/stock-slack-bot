/* eslint-disable @typescript-eslint/no-explicit-any */
import http from 'http';
import app from './www';
import { Error } from '../debug/error';
import config from '../config/config.json';
import { type Request } from 'express';
import { type IForm, checkForm } from '../comm/form-checker';

let server: http.Server;

function initialize(configs: { port: number }): void {
  server = http.createServer(app);
  server.listen(configs.port);
}

function checkRestKey(request: Request): void {
  if (request.headers.key === undefined || request.headers.key !== config.rest.key) {
    throw Error.unauthorized();
  }
}
function checkRestForm(form: IForm, data: Record<string, unknown>): void {
  const confirm = checkForm(data, form);

  if (!confirm) {
    throw Error.badRequestArgument();
  }
}

export default {
  initialize,
  checkRestKey,
  checkRestForm,
  getInstance: () => (server),
};
