import crypto from 'crypto';
import { parseStringPromise, Builder } from 'xml2js';

const builder = new Builder();

const base64 = (data: string): string => Buffer.from(data).toString('Base64');
const getDate = () => new Date() // yyyy-MM-dd hh:mm:ss
  .toISOString()
  .replace(/T/, ' ')
  .replace(/\..+/, '');
const jsonToXmlString = (obj: any) => builder.buildObject(obj);
const sha256 = (data: string): string => crypto
  .createHash('sha256')
  .update(data, 'utf8')
  .digest('hex');
const xmlStringToJson = async (body: any): Promise<any> => parseStringPromise(body || '');
const createLogger = (isSilent: boolean) => (...data: any) => {
  if (isSilent) return;
  console.log(getDate(), '[SMS]',  ...data)
};

export {
  base64,
  getDate,
  jsonToXmlString,
  createLogger,
  sha256,
  xmlStringToJson
};
