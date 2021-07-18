import IConnector from './IConnector';
import { Protocol } from '../interfaces';
import { DEFAULT_HOST, DEFAULT_PROTOCOL } from '../common';
import { axiosConnector, cUrlConnector } from './impl';

const connector = (host: string, protocol: Protocol, networkInterface?: string): IConnector => {
  const baseUrl = `${protocol || DEFAULT_PROTOCOL}://${(host || DEFAULT_HOST)}`;

  return networkInterface?.length
    ? (cUrlConnector(baseUrl, networkInterface))
    : axiosConnector(baseUrl);
}

export default connector;
