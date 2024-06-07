import * as CryptoJS from 'crypto-js';

import { RequestUrlResponsePromise, requestUrl } from "obsidian";
import { baiduAPI, tencentAPI } from 'src/types';
import { md5, sha256Hex } from "src/utils";

export function translateBaidu(baiduapi: baiduAPI, SourceText: string, from?: string, to?: string): RequestUrlResponsePromise {
  // 1. 准备请求地址
  const url = 'https://fanyi-api.baidu.com/api/trans/vip/translate';
  // 2. 准备请求参数
  const q = SourceText;
  const salt = Math.random().toString(36).substring(2, 15);
  const sign = md5(baiduapi.appid + q + salt + baiduapi.appkey);
  const data = `appid=${baiduapi.appid}&q=${q}&from=${from?from:baiduapi.from}&to=${to?to:baiduapi.to}&salt=${salt}&sign=${sign}`;
  // 3. 发送请求
  const response = requestUrl({
    url,
    method: 'POST',
    body: data,
    contentType: 'application/x-www-form-urlencoded',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  return response;
}

export function translateTencent(tencentapi: tencentAPI, SourceText: string, from?: string, to?: string): RequestUrlResponsePromise {
  // 腾讯翻译测试
  const service = "tmt";
  const host = 'tmt.tencentcloudapi.com';
  const region = tencentapi.region;
  const action = 'TextTranslate'; // 代表需要文本翻译服务
  const version = tencentapi.version;
  const algorithm = "TC3-HMAC-SHA256";
  const timestamp  = String(Math.floor(Date.now() / 1000));
  // 转换为标准时间格式 yyyy-mm-dd
  const inttimestamp = new Date(parseInt(timestamp + "000")); // 将秒转换为毫秒
  const year = inttimestamp.getUTCFullYear();
  const month = String(inttimestamp.getUTCMonth() + 1).padStart(2, '0'); // 月份是从0开始的
  const day = String(inttimestamp.getUTCDate()).padStart(2, '0');
  const date = `${year}-${month}-${day}`;
  
  const source = from ? from : tencentapi.from;
  const target = to ? to : tencentapi.to;
  const contentType = 'application/json; charset=utf-8';
  // const untranslatedText = '...'; 放不希望被翻译的内容
  const body = {
    SourceText: SourceText,
    Source: source,
    Target: target,
    ProjectId: 0
  };
  const payload = JSON.stringify(body);
  
  // ************* 步骤 1：拼接规范请求串 *************
  const httpRequestMethod = "POST";
  const canonicalUri = "/";
  const canonicalQueryString = "";
  // const canonicalHeaders = "content-type:application/json\nhost:" + host + "\n";
  const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-tc-action:${action.toLowerCase()}\n`;
  const signedHeaders = "content-type;host;x-tc-action";
  // 使用 SubtleCrypto 做 SHA256 哈希，然后十六进制编码，最后编码串转换成小写字母。
  const hashedRequestPayload = sha256Hex(payload);
  const canonicalRequest = httpRequestMethod + "\n" + 
                          canonicalUri + "\n" + 
                          canonicalQueryString + "\n" + 
                          canonicalHeaders + "\n" + 
                          signedHeaders + "\n" + 
                          hashedRequestPayload;
  // console.log(CanonicalRequest);

  // ************* 步骤 2：拼接待签名字符串 *************
  // UTC 标准时间的日期，取值需要和 RequestTimestamp 换算的 UTC 标准时间日期一致；
  const credentialScope = date + "/" + service + "/tc3_request";
  const hashedCanonicalRequest = sha256Hex(canonicalRequest);
  // 得到待签名字符串
  const stringToSign = algorithm + "\n" + 
                      timestamp + "\n" + 
                      credentialScope + "\n" + 
                      hashedCanonicalRequest;


  // ************* 步骤 3：计算签名 *************
  const SecretId = tencentapi.secretId;
  const SecretKey = tencentapi.secretKey;
  const SecretDate = CryptoJS.HmacSHA256(date, "TC3" + SecretKey);
  const SecretService = CryptoJS.HmacSHA256(service, SecretDate);
  const SecretSigning = CryptoJS.HmacSHA256("tc3_request", SecretService);
  const Signature = CryptoJS.enc.Hex.stringify(CryptoJS.HmacSHA256(stringToSign, SecretSigning)).toLowerCase();

  // ************* 步骤 4：拼接 Authorization *************
  const authorization = algorithm + " " + 
                      'Credential=' + SecretId + '/' + credentialScope + ', ' + 
                      'SignedHeaders=' + signedHeaders + ", " + 
                      "Signature=" + Signature;
  // console.log(authorization);
  // 步骤五：发送请求
  const response = requestUrl({
    method: 'POST',
    url: "https://" + host,
    headers: {
      'Authorization': authorization,
      'content-type': contentType,
      'X-TC-Action': action,
      'X-TC-Timestamp': timestamp,
      'X-TC-Version': version,
      'X-TC-Region': region
    },
    body: payload,
  });
  return response;
}