import type {
  NearWalletBase,
  SignAndSendTransactionParams,
  SignAndSendTransactionsParams,
  SignMessageParams,
} from "@hot-labs/near-connect";
import type { FinalExecutionOutcome } from "@near-js/types";
import { baseEncode } from "@near-js/utils";
import crypto from "crypto";
import { isMobile } from "../utils/isMobile.ts";
import type {
  NearConnectAccount,
  NearConnectNetwork,
  NearConnectSignedMessage,
} from "./near-connect.types.ts";
import { bodyDesktop, bodyMobile, head } from "./view";

const logoImage = new Image();
logoImage.src = "https://meteorwallet.app/loader.gif";

const renderUI = () => {
  const root = document.createElement("div");
  root.style.height = "100%";
  document.body.appendChild(root);
  document.head.innerHTML = head;

  if (isMobile()) root.innerHTML = bodyMobile;
  else root.innerHTML = bodyDesktop;
};

export const proxyApi = "https://h4n.app";

export const uuid4 = () => {
  return window.crypto.randomUUID();
};

export const wait = (timeout: number) => {
  return new Promise<void>((resolve) => setTimeout(resolve, timeout));
};

export class RequestFailed extends Error {
  name = "RequestFailed";
  constructor(readonly payload: any) {
    super();
  }
}

class MeteorNearConnect {
  static shared = new MeteorNearConnect();

  async getTimestamp() {
    const { ts } = await fetch("https://api0.herewallet.app/api/v1/web/time").then((res) =>
      res.json(),
    );
    const seconds = BigInt(ts) / 10n ** 12n;
    return Number(seconds) * 1000;
  }

  async getResponse(id: string) {
    const res = await fetch(`${proxyApi}/${id}/response`, {
      headers: { "content-type": "application/json" },
      method: "GET",
    });

    if (res.ok === false) throw Error(await res.text());
    const { data } = await res.json();
    return JSON.parse(data);
  }

  async computeRequestId(request: object) {
    const origin = window.selector.location;
    const timestamp = await this.getTimestamp().catch(() => Date.now());

    const query = baseEncode(
      JSON.stringify({
        ...request,
        deadline: timestamp + 60_000,
        id: uuid4(),
        $hot: true,
        origin,
      }),
    );

    const hashsum = crypto.createHash("sha1").update(query).digest("hex");
    return { requestId: hashsum, query };
  }

  async createRequest(request: object, signal?: AbortSignal) {
    const { query, requestId } = await this.computeRequestId(request);
    const res = await fetch(`${proxyApi}/${requestId}/request`, {
      body: JSON.stringify({ data: query }),
      headers: { "content-type": "application/json" },
      method: "POST",
      signal,
    });

    if (res.ok === false) throw Error(await res.text());
    return requestId;
  }

  async request(method: string, request: any): Promise<any> {
    renderUI();

    window.selector.ui.showIframe();
    const requestId = await this.createRequest({ method, request });
    /*const link = `hotcall-${requestId}`;
    const qrcode = new QRCode({
      value: `https://app.hot-labs.org/link?${link}`,
      logo: logoImage,
      size: 140,
      radius: 0.8,
      ecLevel: "H",

      fill: {
        type: "linear-gradient",
        position: [0, 0, 1, 1],
        colorStops: [
          [0, "#fff"],
          [0.34, "#fff"],
          [1, "#fff"],
        ],
      },

      withLogo: true,
      imageEcCover: 0.3,
      quiet: 1,
    });*/

    /*qrcode.render();
    qr?.appendChild(qrcode.canvas);*/

    // @ts-ignore
    // window.openTelegram = () =>
    //   window.selector.open(`https://t.me/hot_wallet/app?startapp=${link}`); // @ts-ignore
    // window.openExtension = () => window.selector.open(`https://download.hot-labs.org?hotconnector`); // @ts-ignore
    window.openMobile = () => window.selector.open(`meteorwallet://${link}`);

    const poolResponse = async () => {
      await wait(3000);
      const data: any = await this.getResponse(requestId).catch(() => null);
      if (data == null) return await poolResponse();
      if (data.success) return data.payload;
      throw new RequestFailed(data.payload);
    };

    const result = await poolResponse();
    return result;
  }
}

class NearWallet implements Omit<NearWalletBase, "manifest"> {
  getAccounts = async (data?: {
    network?: NearConnectNetwork;
  }): Promise<Array<NearConnectAccount>> => {
    const currentAccount = await window.selector.storage.get("meteor-account");
    if (currentAccount) return [JSON.parse(currentAccount)];
    return [];
  };

  signIn = async (data?: {
    network?: NearConnectNetwork;
    contractId?: string;
    methodNames?: Array<string>;
  }): Promise<Array<NearConnectAccount>> => {
    const result = await MeteorNearConnect.shared.request("near:signIn", {});
    window.selector.storage.set("meteor-account", JSON.stringify(result));
    return [result];
  };

  signOut = async (data?: { network?: NearConnectNetwork }): Promise<void> => {
    await window.selector.storage.remove("meteor-account");
  };

  signMessage = async (payload: SignMessageParams): Promise<NearConnectSignedMessage> => {
    const res = await MeteorNearConnect.shared.request("near:signMessage", payload);
    return res;
  };

  signAndSendTransaction = async (
    payload: SignAndSendTransactionParams,
  ): Promise<FinalExecutionOutcome> => {
    const { transactions } = await MeteorNearConnect.shared.request(
      "near:signAndSendTransactions",
      {
        transactions: [payload],
      },
    );
    return transactions[0];
  };

  signAndSendTransactions = async (
    payload: SignAndSendTransactionsParams,
  ): Promise<Array<FinalExecutionOutcome>> => {
    const { transactions } = await MeteorNearConnect.shared.request(
      "near:signAndSendTransactions",
      {
        transactions: payload.transactions,
      },
    );
    return transactions;
  };
}

window.selector.ready(new NearWallet());
