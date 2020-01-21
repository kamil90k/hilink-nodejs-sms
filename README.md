# hilink-nodejs-sms
Node.js application to send sms from Huawei routers/modems.
Tested with latest software for Huawei E5573s-320, details:

* Device name:		E5573s-320
* Hardware version:	CL1E5573SM01
* Software version:	21.326.62.00.264

Module should work with other devices compatible with Huawei Hilink software.

## Installation

```sh
$ npm install
```

## Sending sms

Provide `login` and `hash of your password` to router/modem
```js
const HilinkSms from 'HilinkSms';  // HilinkSms will be publish to the NPM soon!
const hilink = new HilinkSms({
  login: 'admin',
  sha256password: '4bb2a3512d098de9029abd16638c60a1a877aac591cb06ba69a6eacd1f64c010'
});
await hilink.sms('hello huawei!', ['500600700']);

```

`function sms(param1, param2)`

parameter | Description | type
--- | --- | ---
`param1` | SMS text | String
`param2` | phone number / numbers | String / Array of Strings


## Caution

HUAWEI HILINK is trademark of Huawei Technologies Co., Ltd.
