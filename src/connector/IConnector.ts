import { IConnectorResponse } from './index';

interface IConnector {
  post: (url: string, body?: string, headers?: { [name: string]: string }) => Promise<IConnectorResponse>;
  get: (url: string, headers?: { [name: string]: string }) => Promise<IConnectorResponse>;
}

export default IConnector;
