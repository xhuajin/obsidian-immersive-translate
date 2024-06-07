export interface baiduAPI {
  type: string;
  appid: string;
  appkey: string;
  from: string;
  to: string;
  delay: number;
}

export interface tencentAPI {
  type: string;
  secretId: string;
  secretKey: string;
  from: string;
  to: string;
  delay: number;
  region: string;
  version: string;
}

export interface tranConfig {
  server: string;
  from: string;
  to: string;
}