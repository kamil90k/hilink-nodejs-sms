import HilinkSms from '../src';
import Nock from 'nock';
import { base64, getDate, jsonToXmlString, sha256 } from '../src/utils';
import * as utils from '../src/utils';
import { uuid } from './testUtils';

// mock generating date
(utils.getDate as any) = jest.fn(() => 'yyyy-MM-dd hh:mm:ss');

const DEFAULT_PROTOCOL = 'http',
  DEFAULT_HOST = '192.168.0.1',
  BASE_PATH = `${DEFAULT_PROTOCOL}://${DEFAULT_HOST}`,
  LOGIN = 'admin',
  PASSWORD = 'password',
  RECEIPENT = '500600700';

const nock = Nock(BASE_PATH, { allowUnmocked: false });

const getLoginReqBody = (session: string, reqVerToken: string) => jsonToXmlString({
  Username: LOGIN,
  Password: base64(sha256(LOGIN + base64(PASSWORD) + reqVerToken)),
  password_type: 4
});

const getSmsReqBody = (message: string) => jsonToXmlString({
  Index: -1,
  Phones: {
    Phone: RECEIPENT
  },
  Sca: '',
  Content: message,
  Length: message.length,
  Reserved: 1,
  Date: getDate()
});

// http mocks
const mockSessionResponse = () => {
  const reqVerToken = uuid();
  const session = uuid();

  nock.get('/api/webserver/SesTokInfo')
    .reply(200, jsonToXmlString({
      response: {
        SesInfo: [session],
        TokInfo: [reqVerToken]
      }
    }));

  return { reqVerToken, session }
};

const mockLoginResponse = (session: string, reqVerToken: string, tokens: string[]) => {
  const smsSessionId = uuid();
  nock
    .post('/api/user/login', getLoginReqBody(session, reqVerToken))
    .matchHeader('cookie', session)
    .matchHeader('__RequestVerificationToken', reqVerToken)
    .reply(
      200,
      jsonToXmlString({ response: 'OK' }),
      { '__requestverificationtoken': tokens.join('#'),
        'set-cookie': smsSessionId }
    );
  tokens.pop(); // important! remove empty token

  return smsSessionId;
};

const mockSmsResponse = (message: string, smsSessionId: string, tokens: string[]) => {
  nock.log(console.log)
    .post('/api/sms/send-sms', getSmsReqBody(message))
    .matchHeader('cookie', smsSessionId)
    .matchHeader('__RequestVerificationToken', tokens.pop() as string)
    .reply(200, jsonToXmlString({ response: 'OK' }));
};

describe('Huawei HiLink sms', () => {
  it('success - authenticate and send sms', async () => {
    // SESSION
    const { reqVerToken, session } = mockSessionResponse();

    // LOGIN
    const tokens = [uuid(), uuid(), uuid(), '']; // last token must be empty!
    const smsSession = mockLoginResponse(session, reqVerToken, tokens);

    // SMS
    const message = 'sample message';
    mockSmsResponse(message, smsSession, tokens);

    const hilinkSms = new HilinkSms({
      protocol: DEFAULT_PROTOCOL,
      host: DEFAULT_HOST,
      login: LOGIN,
      sha256password: PASSWORD
    });

    await hilinkSms.sms(message, RECEIPENT);
  });

});
