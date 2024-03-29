import HilinkSms from '../src/HilinkSms';
import Nock from 'nock';
import { base64, getDate, jsonToXmlString, sha256 } from '../src/utils';
import * as utils from '../src/utils'; // mock purpose
import { uuid } from './testUtils';
import { Protocol } from '../src/interfaces';

// mock generating date
(utils.getDate as any) = jest.fn(() => 'yyyy-MM-dd hh:mm:ss');

const DEFAULT_PROTOCOL = Protocol.Http,
  DEFAULT_HOST = '192.168.8.1',
  BASE_PATH = `${DEFAULT_PROTOCOL}://${DEFAULT_HOST}`,
  LOGIN = 'admin',
  PASSWORD = 'password',
  RECIPIENT = '500600700';

const nock = Nock(BASE_PATH, { allowUnmocked: false });

const getLoginReqBody = (session: string, reqVerToken: string) => jsonToXmlString({
  Username: LOGIN,
  Password: base64(sha256(LOGIN + base64(PASSWORD) + reqVerToken)),
  password_type: 4
});
const getSmsReqBody = (message: string) => jsonToXmlString({
  Index: -1,
  Phones: {
    Phone: RECIPIENT
  },
  Sca: '',
  Content: message,
  Length: message.length,  Reserved: 1,
  Date: getDate()
});

// http mocks
const mockSessionResponse = () => {
  const reqVerToken = uuid();
  const session = uuid();

  nock
    .get('/api/webserver/SesTokInfo')
    .reply(200, jsonToXmlString({
      response: {
        SesInfo: [ session ],
        TokInfo: [ reqVerToken ]
      }
    }));

  return {reqVerToken, session}
};
const mockLoginResponse = (session: string, reqVerToken: string, tokenAmount: number = 3) => {
  const smsSession = uuid();
  const tokens = new Array(tokenAmount)
    .fill('')
    .map(uuid)
    .concat(''); // last token must be empty!

  nock
    .post('/api/user/login', getLoginReqBody(session, reqVerToken))
    .matchHeader('cookie', session)
    .matchHeader('__RequestVerificationToken', reqVerToken)
    .reply(
      200,
      jsonToXmlString({response: 'OK'}),
      {
        '__requestverificationtoken': tokens.join('#'),
        'set-cookie': smsSession
      }
    );
  tokens.pop(); // important! remove empty token

  return { smsSession, tokens };
};
const mockSmsResponse = (message: string, smsSessionId: string, tokens: string[], times: number = 1) => {
  nock
    .post('/api/sms/send-sms', getSmsReqBody(message))
    .times(times)
    .matchHeader('cookie', smsSessionId)
    .matchHeader('__RequestVerificationToken', new RegExp(tokens.join('|')))
    .reply(200, jsonToXmlString({response: 'OK'}));
};

describe('Huawei HiLink sms', () => {
  let hilinkSms: HilinkSms;

  beforeEach(() => {
    hilinkSms = new HilinkSms({
      protocol: DEFAULT_PROTOCOL,
      host: DEFAULT_HOST,
      login: LOGIN,
      sha256password: PASSWORD
    });
  });

  afterEach(() => {
    Nock.cleanAll();
    hilinkSms.destroy();
  });

  test('success - automatic authenticate and send sms', async () => {
    const message = 'sample message';
    // session
    const {reqVerToken, session} = mockSessionResponse();
    // login
    const {smsSession, tokens} = mockLoginResponse(session, reqVerToken);
    // sms
    mockSmsResponse(message, smsSession, tokens);

    await hilinkSms.sms(message, RECIPIENT);
    expect(nock.pendingMocks().length).toEqual(0);
  });

  test('success - automatic authenticate and mass sending sms', async () => {
    const message = 'sample message';
    // session
    const {reqVerToken, session} = mockSessionResponse();
    // login
    const {smsSession, tokens} = mockLoginResponse(session, reqVerToken, 10);
    // sms
    mockSmsResponse(message, smsSession, tokens, 10);

    const massSmsPromises: Promise<void>[] = [];
    for (let i = 0; i < 10; i++) {
      massSmsPromises.push(hilinkSms.sms(message, RECIPIENT));
    }

    await Promise.all(massSmsPromises);
    hilinkSms.destroy();

    expect(nock.pendingMocks().length).toEqual(0);
  });

  test('success - 2x automatic authenticate', async () => {
    // SMS 1
    const message = 'sample message';
    // session
    const {reqVerToken, session} = mockSessionResponse();
    // login
    const {smsSession, tokens} = mockLoginResponse(session, reqVerToken);
    // sms
    mockSmsResponse(message, smsSession, tokens, 3);

    await hilinkSms.sms(message, RECIPIENT);
    await hilinkSms.sms(message, RECIPIENT);
    await hilinkSms.sms(message, RECIPIENT);

    // SMS 2
    const message2 = 'sample message 2';
    // session
    const {reqVerToken: reqVerToken2, session: session2} = mockSessionResponse();
    // login
    const {smsSession: smsSession2, tokens: tokens2} = mockLoginResponse(session2, reqVerToken2);
    // sms
    mockSmsResponse(message2, smsSession2, tokens2, 3);

    await hilinkSms.sms(message2, RECIPIENT);
    await hilinkSms.sms(message2, RECIPIENT);
    await hilinkSms.sms(message2, RECIPIENT);

    expect(nock.pendingMocks().length).toEqual(0);
  });

  test('failed - reach session endpoint', async () => {
    let error: any;
    nock
      .get('/api/webserver/SesTokInfo')
      .replyWithError('sth goes wrong...');

    try {
      await hilinkSms.sms('message', RECIPIENT);
    } catch (err) {
      error = err
    } finally {
      expect(error).toMatch(/.*Network error.*/);
    }

    expect(nock.pendingMocks().length).toEqual(0);
  });

  test('failed - reach login endpoint', async () => {
    let error: any;
    // session
    await mockSessionResponse();
    // login
    nock
      .post('/api/user/login')
      .replyWithError('sth goes wrong...');

    try {
      await hilinkSms.sms('message', RECIPIENT);
    } catch (err) {
      error = err
    } finally {
      expect(error).toMatch(/.*Network error.*/);
    }

    expect(nock.pendingMocks().length).toEqual(0);
  });

  test('failed - reach sms endpoint', async () => {
    let error: any;
    // session
    const {reqVerToken, session} = mockSessionResponse();
    // login
    mockLoginResponse(session, reqVerToken);

    nock
      .post('/api/sms/send-sms')
      .replyWithError('sth goes wrong...');

    try {
      await hilinkSms.sms('message', RECIPIENT);
    } catch (err) {
      error = err
    } finally {
      expect(error).toMatch(/.*Network error.*/);
    }

    expect(nock.pendingMocks().length).toEqual(0);
  });

});
