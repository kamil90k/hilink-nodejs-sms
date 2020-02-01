type Protocol = 'http' | 'https';
interface IHilinkSmsConfig {
  login: string;
  sha256password: string;
  protocol?: Protocol;
  host?: string;
}
interface IGetSessionResponse {
  response: {
    SesInfo: string[];
    TokInfo: string[];
  }
}
interface IHilinkSms {
  sms: (message: string, recipient: string | string[]) => Promise<void>;
}

export {
  IGetSessionResponse,
  IHilinkSms,
  IHilinkSmsConfig,
  Protocol
}