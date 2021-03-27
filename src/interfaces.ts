type Protocol = 'http' | 'https';
interface IHilinkSmsConfig {
  login: string;
  sha256password: string;
  protocol?: Protocol;
  host?: string;
  silentLogs?: boolean;
}
interface IGetSessionResponse {
  response: {
    SesInfo: string[];
    TokInfo: string[];
  }
}
interface IHilinkSms {
  sms: (message: string, recipient: string | string[]) => Promise<void>;
  destroy: () => void;
}
interface IApiResponse {
  response?: 'OK';
}

export {
  IApiResponse,
  IGetSessionResponse,
  IHilinkSms,
  IHilinkSmsConfig,
  Protocol
}