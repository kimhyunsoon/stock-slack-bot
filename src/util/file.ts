import fs from 'fs';
import { imageSize } from 'image-size';
import { Error } from '../debug/error';
import { uploads } from '../config/config.json';
import { type ISizeCalculationResult } from 'image-size/dist/types/interface';
import comm from '../comm';
import group from '../util/group';

interface FilePayload {
  name: string
  size: number
  meta?: object
  data: ArrayBuffer[]
}

const defaultPayloadUnit = 1500;

function makePrefix(): string {
  const date = new Date();
  return date.getTime().toString();
}

function combineBufferAsArrayBuffer(buffers: ArrayBuffer[]): Uint8Array {
  const size = buffers.reduce<number>((total, buf) => (total + buf.byteLength), 0);
  const bytes = new Uint8Array(size);

  let offset = 0;
  buffers.forEach((buf) => {
    bytes.set(new Uint8Array(buf), offset);
    offset += buf.byteLength;
  });

  return bytes;
}

function divideBuffer(buf: ArrayBuffer, payloadUnit = defaultPayloadUnit): ArrayBuffer[] {
  const data: ArrayBuffer[] = [];
  const last = buf.byteLength;

  for (let index = 0; index < last; index += payloadUnit) {
    data.push(buf.slice(index, index + payloadUnit));
  }

  return data;
}

async function makeDir(path: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    fs.mkdir(path, { recursive: true }, (error) => {
      if (error != null) {
        reject(Error.makeError(error));
      } else {
        resolve(true);
      }
    });
  });
}

async function writeFile(path: string, buffer: Uint8Array): Promise<boolean> {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, buffer, (error) => {
      if (error != null) {
        reject(Error.makeError(error));
      } else {
        resolve(true);
      }
    });
  });
}

async function readFile(path: string): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (error, data) => {
      if (error != null) {
        reject(Error.makeError(error));
      } else {
        resolve(data);
      }
    });
  });
}

function deleteFile(path: string): void {
  fs.unlink(path, () => {});
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function readFileChunk(file: Record<string, any>, user: Record<string, any>): Promise<void> {
  return new Promise((resolve, reject) => {
    const { name, path, size, no } = file;
    fs.readFile(path, (error, _data) => {
      if (error != null) {
        reject(Error.makeError(error));
      } else {
        const chunkSize = 1024 * 1024; // 1MB
        const totalChunks = Math.ceil(_data.length / chunkSize);
        for (let i = 0; i < totalChunks; i += 1) {
          const data = _data.slice(i * chunkSize, (i + 1) * chunkSize);
          const progress = Math.floor((i + 1) / totalChunks * 100);
          if (i === 0) {
            comm.getInstance()
              ?.server
              .to(group.userSocketGroup(user.no))
              .emit('file.get.progress.start', {
                name,
                size,
                data,
                progress,
                no,
              });
          } else {
            comm.getInstance()
              ?.server
              .to(group.userSocketGroup(user.no))
              .emit('file.get.progress', {
                data,
                progress,
                no,
              });
          }
        }
        comm.getInstance()
          ?.server
          .to(group.userSocketGroup(user.no))
          .emit('file.get.progress.end', {
            no,
          });
      }
    });
  });
}

async function readImageSize(file: string): Promise<ISizeCalculationResult> {
  return imageSize(file);
}

async function writeFileFromPayload(filePayload: FilePayload, type?: string): Promise<string | undefined> {
  let convertType = type;
  if (String(type).includes('post')) convertType = 'post';
  else if (String(type).includes('comment')) convertType = 'comment';

  const buffer = combineBufferAsArrayBuffer(filePayload.data);
  const fileName = `${makePrefix()}_${filePayload.name}`;

  // uploads 폴더가 없을 경우 생성
  if (!fs.existsSync(uploads.path)) await makeDir(uploads.path);
  // 각 type 폴더가 없을 경우 생성
  if (convertType != null && !fs.existsSync(`${uploads.path}/${convertType}`)) await makeDir(`${uploads.path}/${convertType}`);

  let path;
  switch (convertType) {
    case undefined:
      path = `${uploads.path}/${fileName}`;
      break;
    default:
      path = `${uploads.path}/${convertType}/${fileName}`;
      break;
  }

  await writeFile(path, buffer);

  // 저장한 경로 반환
  return path;
}

export {
  uploads,
  deleteFile,
  type FilePayload,
  divideBuffer,
  readImageSize,
  writeFileFromPayload,
  readFile,
  readFileChunk,
  makeDir,
};
