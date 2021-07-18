interface IHilinkSms {
  sms: (message: string, recipient: string | string[]) => Promise<void>;
  destroy: () => void;
}

export default IHilinkSms;
