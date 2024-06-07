import * as CryptoJS from 'crypto-js';

// import { MD5 } from 'crypto-js';

export function sha256Hex(data: string): string {
  return CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex).toLowerCase();
}

export function md5(text: string): string {
  return CryptoJS.MD5(text).toString();
  // return MD5(text).toString();
}