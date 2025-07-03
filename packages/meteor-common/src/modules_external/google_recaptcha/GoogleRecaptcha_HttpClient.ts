import { BaseHttpClient } from "../../modules_utility/http_utilities/BaseHttpClient";
import { HttpError } from "../../modules_utility/http_utilities/HttpError";
import {
  IRecaptchaClient_VerifyToken_Request,
  IRecaptchaClient_VerifyToken_Response,
} from "./google_recaptcha_types";

// This class is using a singleton design
const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
const SECRET_KEY = "6LdkX6kjAAAAAMs21qUIA0LRW8Xm1Ixb6YZ18y_l";

export class GoogleRecaptcha_HttpClient extends BaseHttpClient {
  private static instance: GoogleRecaptcha_HttpClient;

  private constructor() {
    super();
  }

  public static getInstance(): GoogleRecaptcha_HttpClient {
    if (!GoogleRecaptcha_HttpClient.instance) {
      GoogleRecaptcha_HttpClient.instance = new GoogleRecaptcha_HttpClient();
    }

    return GoogleRecaptcha_HttpClient.instance;
  }

  public async verifyToken({
    captchaToken,
  }: IRecaptchaClient_VerifyToken_Request): Promise<IRecaptchaClient_VerifyToken_Response> {
    return fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${SECRET_KEY}&response=${captchaToken}`,
    }).then((response) => response.json());
  }

  // Overriding method here as we need a differnet header
  async sendJson(method: "GET" | "POST", url: string, json: any, options: RequestInit = {}) {
    if (typeof json !== "string") {
      json = JSON.stringify(json);
    }
    url = url.startsWith("http") ? url : this.getBaseUrl() + url;
    console.log(
      fetch(url, {
        method: method,
        body: method !== "GET" ? json : undefined,
        headers: { "Content-type": "application/x-www-form-urlencoded" },
        ...options,
      }),
    );
    const response = await fetch(url, {
      method: method,
      body: method !== "GET" ? json : undefined,
      headers: { "Content-type": "application/x-www-form-urlencoded" },
      ...options,
    });
    if (!response.ok) {
      const body = await response.text();
      let parsedBody;

      try {
        parsedBody = JSON.parse(body);
      } catch (e) {
        throw new HttpError(response.status, body);
      }

      throw new HttpError(response.status, parsedBody);
    }
    if (response.status === 204) {
      // No Content
      return null;
    }
    return await response.json();
  }
}
