/*
author: kamil90k@hotmail.com (https://github.com/kamil90k)
tested on ->
Device name: E5573s-320
Hardware version: CL1E5573SM01
Software version: 21.326.62.00.264
Web UI version: 17.100.18.01.264
*/
import got, { Response } from 'got';
import { base64, getDate, jsonToXmlString, xmlStringToJson, sha256 } from './utils';
import { IApiResponse, IGetSessionResponse, IHilinkSms, IHilinkSmsConfig, Protocol } from './interfaces';

const DEFAULT_PROTOCOL = 'http';
const DEFAULT_HOST = '192.168.8.1';

class HilinkSms implements IHilinkSms {
  private _auth: {
    login: string;
    password: string;
  };
  private _protocol: Protocol;
  private _host: string;

  private _authTokens: string[];
  private _sessionId: string;

  constructor(config: IHilinkSmsConfig) {
    this._auth = {
      login: config.login,
      password: config.sha256password
    };
    this._protocol = config.protocol || DEFAULT_PROTOCOL;
    this._host = config.host || DEFAULT_HOST;

    this._authTokens = [];
    this._sessionId = '';
  }

  public async sms(message: string, recipient: string | string[]): Promise<void> {
    if (this._authTokens.length == 0 || !this._sessionId) {
      console.log('[SMS] auto authentication');
      await this._authenticate();
      return this.sms(message, recipient);
    }

    let params = {
      body: jsonToXmlString({
        Index: -1,
        Phones: {
          Phone: recipient//might be array
        },
        Sca: '',
        Content: message,
        Length: message.length,
        Reserved: 1,//g_text_mode - global variable from oryginal Huawei code
        Date: getDate()
      }),
      headers: {
        cookie: this._sessionId,
        __RequestVerificationToken: this._authTokens.pop()
      }
    };

    const response: Response | any = await got
      .post(this._getSmsURL(), params)
      .catch(this._networkErrorHandler);

    const responseJson: IApiResponse = await xmlStringToJson(response.body);
    if (responseJson.response !== 'OK') {
      throw new Error('[SMS] Failed to send SMS.');
    }
    console.log('[SMS] Send SMS OK');
  };

  private async _authenticate(): Promise<void> {
    const sessionResponse = await this._getSession();
    await this._login(sessionResponse.response);
  };

  private async _getSession(): Promise<IGetSessionResponse> {
    const sessionResponse: Response | any = await got
      .get(this._getSessionTokensURL())
      .catch(this._networkErrorHandler);

    const response = await xmlStringToJson(sessionResponse.body);
    return response as IGetSessionResponse;
  };

  private async _login({ TokInfo, SesInfo }: IGetSessionResponse['response']): Promise<void> {
    const reqVerToken = TokInfo[0];
    const hash = sha256(this._auth.login + base64(this._auth.password) + reqVerToken);
    const encPassword = base64(hash);

    let params = {
      body: jsonToXmlString({
        Username: this._auth.login,
        Password: encPassword,
        password_type: 4//g_password_type - global variable from oryginal Huawei code
      }),
      headers: {
        cookie: SesInfo[0],
        __RequestVerificationToken: reqVerToken
      }
    };

    const response: Response | any = await got
      .post(this._getLoginURL(), params)
      .catch(this._networkErrorHandler);

    const responseJson: IApiResponse = await xmlStringToJson(response.body);
    const { '__requestverificationtoken': verificationToken, 'set-cookie': cookies } = response.headers;
    if (!verificationToken || !Array.isArray(cookies) || responseJson.response !== 'OK') {
      throw new Error('[SMS] Failed to login.');
    }

    this._authTokens = verificationToken.split('#');
    this._authTokens.pop();//last token is empty, remove it
    this._sessionId = cookies[0];
    console.log('[SMS] LOGIN OK');
  };

  private _networkErrorHandler(err: Error) {
    console.log('[SMS] external error message:', err.message);
    throw new Error('[SMS] Network error');
  }

  private _getLoginURL(): string {
    return `${this._protocol}://${this._host}/api/user/login`;
  }

  private _getSessionTokensURL(): string {
    return `${this._protocol}://${this._host}/api/webserver/SesTokInfo`;
  }

  private _getSmsURL(): string {
    return `${this._protocol}://${this._host}/api/sms/send-sms`;
  }
}

export default HilinkSms;