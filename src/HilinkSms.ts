/*
author: kamil90k@hotmail.com (https://github.com/kamil90k)
tested on ->
Device name: E5573s-320
Hardware version: CL1E5573SM01
Software version: 21.326.62.00.264
Web UI version: 17.100.18.01.264
*/
import { getDate, jsonToXmlString, xmlStringToJson, createLogger } from './utils';
import { connector, IConnector } from './connector';
import {
  IApiResponse,
  ICredentialsProvider,
  IHilinkSms,
  IHilinkSmsConfig,
  ILogger,
  ISmsQueueItem,
  ISmsCredentials
} from './interfaces';
import CredentialsProvider from './CredentialsProvider';
import { DEFAULT_PARALLEL_SMS_COUNT, DEFAULT_QUEUE_SLEEP_TIME } from './common';


class HilinkSms implements IHilinkSms {
  private _smsQueue: ISmsQueueItem[];
  private _name: string;
  private _parallelSmsCount: number;
  private _connector: IConnector;
  private _logger: ILogger;
  private _credentialsProvider: ICredentialsProvider;
  private _asyncTaskId: NodeJS.Timeout;

  constructor(config: IHilinkSmsConfig) {
    this._smsQueue = [];
    this._name = config.name;
    this._parallelSmsCount = config.parallelSmsCount || DEFAULT_PARALLEL_SMS_COUNT;

    this._connector = connector(config.host, config.protocol, config.networkInterface);
    this._logger = config.logger !== undefined
      ? config.logger
      : createLogger(!!config.silentLogs, config.name);
    this._credentialsProvider = new CredentialsProvider(config.login, config.sha256password, this._connector, this._logger);

    this._run().catch((e) => {
      this._logger(`SMS provider fatal Error. ${e.message}`);
    });
  }

  private async _run(): Promise<void> {
    while (this._smsQueue.length > 0) {
      const chunks = this._smsQueue.splice(0, this._parallelSmsCount);
      const parallelSms = chunks.map(async (sms) => {
        try {
          await this._sendSms(sms.message, sms.recipient);
          sms.callback();
        } catch (e) {
          sms.callback(e.message);
        }
      });
      await Promise.all(parallelSms);
    }

    this._asyncTaskId = setTimeout(this._run.bind(this), DEFAULT_QUEUE_SLEEP_TIME);
  }

  private async _sendSms(message: string, recipient: string | string[]): Promise<void> {
    const startTime = Date.now();
    const credentials = await this._getCredentials();

    const response = await this._connector.post('/api/sms/send-sms',
      jsonToXmlString({
        Index: -1,
        Phones: { Phone: recipient },
        Sca: '',
        Content: message,
        Length: message.length,
        Reserved: 1,//g_text_mode - global variable from original Huawei code
        Date: getDate()
      }), { cookie: credentials.sessionId, __RequestVerificationToken: credentials.token }
    );

    const responseJson: IApiResponse = await xmlStringToJson(response.body);
    if (responseJson.response !== 'OK') {
      throw new Error(`${this._getDeviceName()} [SMS] Failed to send SMS.`);
    }
    this._logger(`Send SMS OK, ${Math.floor(Date.now() - startTime)}ms`);
  };

  private async _getCredentials(): Promise<ISmsCredentials> {
    try {
      return await this._credentialsProvider.getCredentials();
    } catch (e) {
      throw new Error(`${this._getDeviceName()} ${e.message}.`);
    }
  }

  private _getDeviceName(): string {
    return this._name !== undefined ? this._name : '';
  }

  public async sms(message: string, recipient: string | string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this._smsQueue.push({
        message,
        recipient,
        callback: (err: string) => {
          if (err !== undefined) {
            return reject(err);
          }
          resolve();
        }
      });
    });
  }

  public destroy(): void {
    this._credentialsProvider.destroy();
    clearTimeout(this._asyncTaskId);
  }
}

export default HilinkSms;
