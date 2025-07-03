export class HttpError extends Error {
  statusCode: number;
  msg: any;

  constructor(statusCode: number, msg?: any) {
    super(`HttpError [${statusCode}] ${msg ?? ""}`);
    this.statusCode = statusCode;
    this.msg = msg;
  }
}
