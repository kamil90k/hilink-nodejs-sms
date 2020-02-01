import crypto from 'crypto';

const uuid = () => crypto.randomBytes(8).toString('hex');

export {
  uuid
}