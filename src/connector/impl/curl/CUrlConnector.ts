import { exec } from 'child_process';

import { IConnectorResponse } from '../../index';
import IConnector from '../../IConnector';
import { networkErrorHandler } from '../../../common';

const cUrlRequest = async (url: string, body?: string, options?: { headers?: { [name: string]: string }, networkInterface?: string, method?: string }): Promise<IConnectorResponse> => {
  return new Promise((resolve, reject) => {
    const headersText = options?.headers !== undefined ? Object.keys(options.headers).map(hName => ` -H "${hName}: ${options.headers[hName]}" `).join('') : '';
    const bodyText = body !== undefined ? ` -d "${body}" ` : '';
    const interfaceText = options?.networkInterface !== undefined ? ` --interface ${options.networkInterface} ` : '';
    const methodText = options?.method?.toUpperCase() === 'POST' ? ' -X POST ' : '';

    exec('curl -i ' + headersText + interfaceText + bodyText + methodText + url, (error, stdout, stderr) => {
      if (error) {
        networkErrorHandler(error);
      }

      const responseRows = stdout.split('\n');
      responseRows.shift(); // http status
      const divider = responseRows.indexOf('\r');
      if (divider === -1) {
        reject('Parsing response error.');
      }

      const headers = responseRows.slice(0, divider);
      const body = responseRows.slice(divider + 1, responseRows.length);

      resolve({
        headers: headers.reduce((result, phrase) => {
          let [ key, value ] = phrase.split(':');
          result[key.trim().toLowerCase()] = value.trim();

          return result;
        }, {}),
        body: body.join('')
      });
    });
  });
};

const cUrlConnector = (baseUrl: string, networkInterface: string): IConnector => ({
  get: async (url: string, headers): Promise<IConnectorResponse> => {
    return await cUrlRequest(baseUrl + url, undefined, {networkInterface, method: 'GET', headers})
  },
  post: async (url: string, body?: string, headers?: { [name: string]: string }): Promise<IConnectorResponse> => {
    return await cUrlRequest(baseUrl + url, body, {networkInterface, method: 'GET', headers})
  }
})

export default cUrlConnector;
