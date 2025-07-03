export interface IRecaptchaClient_VerifyToken_Request {
  captchaToken: string;
  remoteIp?: string;
}

export interface IRecaptchaClient_VerifyToken_Response {
  hostname: string;
  success: boolean;
  challenge_ts?: string;
  score?: number;
  "error-codes"?: string[];
}
