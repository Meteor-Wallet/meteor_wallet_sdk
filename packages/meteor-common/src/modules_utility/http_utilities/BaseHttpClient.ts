import { HttpError } from "./HttpError";

// This class is a slight modification of FetchHelper Class
export abstract class BaseHttpClient {
  protected getBaseUrl() {
    return "";
  }

  protected async sendJson(
    method: "GET" | "POST",
    url: string,
    json: any,
    options: RequestInit = {},
  ) {
    if (typeof json !== "string") {
      json = JSON.stringify(json);
    }
    url = url.startsWith("http") ? url : this.getBaseUrl() + url;

    let headers: any = { "Content-type": "application/json; charset=utf-8" };
    if (options.headers?.["Content-Type"] === "-1") {
      headers = {};
      options.headers = {};
    }

    const response = await fetch(url, {
      method: method,
      body: method !== "GET" ? json : undefined,
      headers: headers,
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

  protected async getJson(url: string, options: RequestInit = {}) {
    return await this.sendJson("GET", url, "", options);
  }

  protected async postJson(url: string, data: string | any, options: RequestInit = {}) {
    return await this.sendJson("POST", url, data, options);
  }

  protected async fetchJsonFromIpfs(url: string, options: RequestInit = {}) {
    url = url.startsWith("http") ? url : this.getBaseUrl() + url;
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new HttpError(response.status, response);
    }
    return await response.json();
  }

  protected withQuery(url: string, query: { [key: string]: any }) {
    const [base, q] = url.split("?");
    const params = new URLSearchParams(q);
    Object.entries(query).forEach(([k, v]) => {
      params.append(k, v);
    });
    return `${base}?${params.toString()}`;
  }

  /**
   * shortcut to withQuery
   * @param url
   * @param query
   */
  protected q(url: string, query: { [key: string]: any }) {
    return this.withQuery(url, query);
  }
}
