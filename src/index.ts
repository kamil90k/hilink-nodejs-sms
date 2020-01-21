/*
author: kamil90k@hotmail.com (https://github.com/kamil90k)
tested on ->
Device name: E5573s-320
Hardware version: CL1E5573SM01
Software version: 21.326.62.00.264
Web UI version: 17.100.18.01.264
*/
import got from 'got';
import { base64, getDate, jsonToXmlString, xmlStringToJson, sha256 } from './utils';
import { IGetSessionResponse, IHilinkSms, IHilinkSmsConfig, Protocol } from './interfaces';

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
  private _smsRetryCount: number;

  constructor(config: IHilinkSmsConfig) {
    this._auth = {
      login: config.login,
      password: config.sha256password
    };
    this._protocol = config.protocol || DEFAULT_PROTOCOL;
    this._host = config.host || DEFAULT_HOST;

    this._authTokens = [];
    this._sessionId = '';
    this._smsRetryCount = 0;
  }

  public async sms(message: string, recipient: string | string[]): Promise<void> {
    if (this._smsRetryCount > 2) {
      console.log('SMS fails, retries: ' + this._smsRetryCount);
      throw new Error('');
    }

    if (this._authTokens.length == 0 || !this._sessionId) {
      console.log('AUTO AUTHENTICATION');
      this._smsRetryCount += 1;
      await this._authenticate();
      await this.sms(message, recipient);
      return;
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

    const response = await got.post(this._getSmsURL(), params);
    console.log('SMS\n', await xmlStringToJson(response.body));
    this._smsRetryCount = 0;
  };

  private async _authenticate(): Promise<void> {
    const sessionResponse = await this._getSession();
    await this._login(sessionResponse.response);
  };

  private async _getSession(): Promise<IGetSessionResponse> {
    const sessionResponse = await got(this._getSessionTokensURL());
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

    const loginResponse: any = await got.post(this._getLoginURL(), params);
    if (!loginResponse.headers['__requestverificationtoken'] || loginResponse.headers['set-cookie'] == null) {
      throw new Error('Failed to login.');
    }

    this._authTokens = loginResponse.headers['__requestverificationtoken'].split('#');
    this._authTokens.pop();//last token is empty, remove it
    this._sessionId = loginResponse.headers['set-cookie'][0];
    console.log('LOGIN\n', await xmlStringToJson(loginResponse.body));
  };

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