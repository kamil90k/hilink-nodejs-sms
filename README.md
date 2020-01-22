# hilink-nodejs-sms
Node.js library to send sms from Huawei routers/modems. Written in typescript.

Tested with latest software for Huawei E5573s-320, details:

* Device name:		E5573s-320
* Hardware version:	CL1E5573SM01
* Software version:	21.326.62.00.264

Library should work with other devices compatible with Huawei Hilink software.

## Installation

```sh
$ npm install hilink-nodejs-sms --save
```

## Sending sms

Provide `login` and `hash of your password` to router/modem
```js
import HilinkSms from 'hilink-nodejs-sms';

const hilink = new HilinkSms({
  login: 'admin',
  sha256password: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // sha256('password')
  host: '192.168.8.1', // optional, Huawei device IP
  protocol: 'http' // optional
});
await hilink.sms('hello huawei!', ['500600700']);

```

[typescript]

`async sms(message: string, recipient: string | string[]): Promise<void>`

parameter | Description | type
--- | --- | ---
`message` | SMS text | String
`recipient` | phone number / numbers | String / Array of Strings


## Caution

HUAWEI HILINK is trademark of Huawei Technologies Co., Ltd.
