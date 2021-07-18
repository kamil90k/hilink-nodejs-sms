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

## Initialize object instance
Set at least `login` and `hash of your password` in the configuration
```js
import HilinkSms from 'hilink-nodejs-sms';

const hilink = new HilinkSms({
  login: 'admin',
  sha256password: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // sha256('password')
  silentLogs: false,                   // optional, turn on / turn off the logs (doesn't work if custom logger is defined)
  logger: (info) => {                  // optional, custom logger
    console.log(`----- ${info} -----`);
  },
  name: 'E5573s-320',                  // optional, device name used to distinguish many devices
  parallelSmsCount: 2,                 // optional, number of messages sent in parallel to the device
  networkInterface: 'enx0c5b8f279a64', // optional, specify the network interface in case of multiple internet connections (linux only with curl installed)
  host: '192.168.8.1',                 // optional
  protocol: 'http'                     // optional
});
```

## Send SMS
```js
  hilink
    .sms('Hello!', '500600700')
    .then(() => { console.log('success!'); })
    .catch((e) => { console.log('fail!', e); })
```
or use async/await
```js
  try {
    await hilink.sms('Hello!', '500600700');
    console.log('success!');
  } catch (e) {
     console.log('fail!', e);
  }
```

[typescript]

`async sms(message: string, recipient: string | string[]): Promise<void>`

parameter | Description | type
--- | --- | ---
`message` | SMS text | String
`recipient` | phone number / numbers | String / Array of Strings

## Destroy instance
It is important to release resources and avoid memory leaks!
Internal implementation of SMS queue is based on timer - remember to clear it as soon as you stop using `hilink-nodejs-sms` functionality.
```js
  hilink.destroy(); // IMPORTANT! remember to release resources!
```
After `destroy` method is called, sending SMS is no longer possible.


## Caution
HUAWEI HILINK is trademark of Huawei Technologies Co., Ltd.
