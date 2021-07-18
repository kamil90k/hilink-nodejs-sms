import Axios, { AxiosResponse } from 'axios';

import IConnector from '../../IConnector';
import { IConnectorResponse } from '../../index';
import { networkErrorHandler } from '../../../common';

const axiosConnector = (baseUrl: string): IConnector => {
  const axios = Axios.create({baseURL: baseUrl});

  return {
    get: async (url: string, headers?: { [name: string]: string }): Promise<IConnectorResponse> => {
      let response: AxiosResponse;
      try {
        response = await axios.get(url, {headers});
      } catch (e) {
        networkErrorHandler(e);
      }

      return {
        body: response.data,
        headers: response.headers
      }
    },
    post: async (url: string, body?: string, headers?: { [name: string]: string }): Promise<IConnectorResponse> => {
      let response: AxiosResponse;
      try {
        response = await axios.post(url, body, {headers});
      } catch (e) {
        networkErrorHandler(e);
      }

      return {
        body: response.data,
        headers: response.headers
      }
    }
  }
}

export default axiosConnector;
