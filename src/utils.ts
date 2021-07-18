import crypto from 'crypto';
import { parseStringPromise, Builder } from 'xml2js';
import { ILogger } from './interfaces';

const builder = new Builder();

const base64 = (data: string): string => Buffer.from(data).toString('Base64');
const getDate = (): string => {
  const currentDate = new Date();
  const date = ('0' + currentDate.getDate()).slice(-2);
  const month = ('0' + (currentDate.getMonth() + 1)).slice(-2);
  const year = currentDate.getFullYear();
  const hours = currentDate.getHours();
  const minutes = currentDate.getMinutes();
  const seconds = currentDate.getSeconds();

  return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
};
const jsonToXmlString = (obj: any) => builder.buildObject(obj);
const sha256 = (data: string): string => crypto
  .createHash('sha256')
  .update(data, 'utf8')
  .digest('hex');
const xmlStringToJson = async (body: any): Promise<any> => parseStringPromise(body || '');
const createLogger = (isSilent: boolean, name: string = ''): ILogger => (message: string) => {
  if (isSilent) return;
  console.log(getDate(), name, '[SMS]', message)
};
const encodePassword = (login: string, password: string, token: string): string => {
  return base64(sha256(login + base64(password) + token));
};
const retrieveToken = (data: string[] | string) => {
  return Array.isArray(data) ? data[0] : data;
}

export {
  base64,
  getDate,
  jsonToXmlString,
  createLogger,
  sha256,
  xmlStringToJson,
  encodePassword,
  retrieveToken
};
