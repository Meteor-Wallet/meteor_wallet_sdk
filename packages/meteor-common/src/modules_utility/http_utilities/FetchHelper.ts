import { HttpError } from "./HttpError";

export class FetchHelper {
  protected getBaseUrl() {
    return "";
  }

  async sendJson(
    method: "GET" | "POST" | "HEAD",
    url: string,
    json: any,
    options: RequestInit = {},
  ) {
    if (typeof json !== "string") {
      json = JSON.stringify(json);
    }
    url = url.startsWith("http") ? url : this.getBaseUrl() + url;
    const response = await fetch(url, {
      method: method,
      body: method !== "GET" ? json : undefined,
      headers: { "Content-type": "application/json; charset=utf-8" },
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

  async getJson(url: string, options: RequestInit = {}) {
    return await this.sendJson("GET", url, "", options);
  }

  async getText(url: string) {
    const response = await fetch(url, { method: "GET" });
    if (!response.ok) {
      throw new HttpError(response.status, response);
    }
    return await response.text();
  }

  async postJson(url: string, data: string | any, options: RequestInit = {}) {
    return await this.sendJson("POST", url, data, options);
  }

  async fetchJsonFromIpfs(url: string, options: RequestInit = {}) {
    url = url.startsWith("http") ? url : this.getBaseUrl() + url;
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new HttpError(response.status, response);
    }
    return await response.json();
  }

  withQuery(url: string, query: { [key: string]: any }) {
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
  q(url: string, query: { [key: string]: any }) {
    return this.withQuery(url, query);
  }
}

export const fetchHelper = new FetchHelper();
