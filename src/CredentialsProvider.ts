import {
  IApiResponse,
  ISmsCredentials,
  ICredentialsProvider,
  IGetSessionResponse,
  ILogger,
  IAuthData
} from './interfaces';
import { IConnector } from './connector';
import { encodePassword, jsonToXmlString, retrieveToken, xmlStringToJson } from './utils';
import { DEFAULT_LOGOUT_TIME } from './common';

class CredentialsProvider implements ICredentialsProvider {
  private readonly _auth: { login: string; password: string; };

  private _tokens: string[] = undefined;
  private _sessionId: string = undefined;

  private _sessionTimeoutId: NodeJS.Timeout | undefined;
  private _authPromise: Promise<void> | undefined;

  constructor(login: string, sha256password: string, private _connector: IConnector, private _logger: ILogger) {
    this._auth = {login: login, password: sha256password};
    this._tokens = [];
  }

  public async getCredentials(): Promise<ISmsCredentials> {
    return await this._getToken();
  }

  public destroy(): void {
    if (this._sessionTimeoutId !== undefined) {
      clearTimeout(this._sessionTimeoutId);
    }
  }

  private async _getToken(retry: number = 0): Promise<ISmsCredentials> {
    if (retry >= 5) {
      throw new Error('[SMS] Try to get token too many times');
    }
    if (this._authPromise !== undefined) {
      await this._authPromise;
    }
    const token = this._tokens.pop();
    if (token === undefined) {
      await this._authenticate();
      return this._getToken(++retry);
    }

    return {token, sessionId: this._sessionId}
  }

  private async _authenticate(): Promise<void> {
    if (this._authPromise !== undefined) {
      return this._authPromise;
    }

    clearTimeout(this._sessionTimeoutId as NodeJS.Timeout);

    this._authPromise = (async (): Promise<void> => {
      const {token, sessionId} = await this._getSession();
      const {tokens, sessionId: latestSessionId} = await this._login(token, sessionId);

      this._tokens = tokens;
      this._sessionId = latestSessionId;
    })();

    await this._authPromise;
    this._authPromise = undefined;
  };

  private async _login(token: string, sessionId: string): Promise<IAuthData> {
    const response = await this._connector.post('/api/user/login',
      jsonToXmlString({
        Username: this._auth.login,
        Password: encodePassword(this._auth.login, this._auth.password, token),
        password_type: 4//g_password_type - global variable from original Huawei code
      }), {cookie: sessionId, __RequestVerificationToken: token});

    const responseJson: IApiResponse = await xmlStringToJson(response.body);
    const {'__requestverificationtoken': verificationToken, 'set-cookie': cookies} = response.headers;
    if (!verificationToken || !cookies || responseJson.response !== 'OK') {
      this._clearSessionData();
      throw new Error('[SMS] Failed to login.' + responseJson);
    }

    this._resetTimeout();
    this._logger('LOGIN OK');

    return {
      sessionId: retrieveToken(cookies),
      tokens: verificationToken.split('#').slice(0, -1) // slice(0, -1) - last token is empty, remove it
    };
  };

  private async _getSession(): Promise<{ token: string, sessionId: string }> {
    const sessionResponse = await this._connector.get('/api/webserver/SesTokInfo');
    const {response} = await xmlStringToJson(sessionResponse.body) as IGetSessionResponse;

    if (response?.SesInfo === undefined || response?.TokInfo === undefined) {
      throw new Error('[SMS] Failed to fetch session data.');
    }

    return {
      token: retrieveToken(response.TokInfo),
      sessionId: retrieveToken(response.SesInfo)
    };
  };

  private _clearSessionData(): void {
    this._tokens = [];
    this._sessionId = '';
  }

  private _resetTimeout(): void {
    this._logger('Auto clear session')
    clearTimeout(this._sessionTimeoutId as NodeJS.Timeout);
    this._sessionTimeoutId = setTimeout(this._clearSessionData.bind(this), DEFAULT_LOGOUT_TIME);
  }
}

export default CredentialsProvider;
