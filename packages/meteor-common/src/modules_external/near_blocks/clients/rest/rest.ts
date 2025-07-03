import { FetchHelper } from "../../../../modules_utility/http_utilities/FetchHelper";
import { ENearNetwork } from "../../../near/types/near_basic_types";
import { nearblocksApiForNetwork, nearblocksApiV3ForNetwork } from "./static_data";
import {
  ETxSourceType,
  IOAccountList_Input,
  IOAccountList_Output,
  IOFtList_Output,
  IOTxList_Input,
  IOTxList_Output,
} from "./type";

export class NearBlocksApi extends FetchHelper {
  private apiURL: string;

  constructor({ network, v3 }: { network: ENearNetwork; v3?: boolean }) {
    super();
    this.apiURL = v3 ? nearblocksApiV3ForNetwork[network] : nearblocksApiForNetwork[network];
  }

  async getTxList(props: IOTxList_Input): Promise<IOTxList_Output> {
    const responses = await fetch(
      `${this.apiURL}/account/${props.address}/txns?&order=desc&page=${props.page}&per_page=${props.limit}`,
    );

    if (!responses.ok) {
      const message = `An error has occured: ${responses.status}`;
      throw new Error(`Error: NearBlocks's getTxList ${message}`);
    }

    const txList: IOTxList_Output = await responses.json();
    return txList;
  }

  async getTxFtList(props: IOTxList_Input): Promise<IOFtList_Output> {
    const responses = await fetch(
      `${this.apiURL}/account/${props.address}/ft-txns?&order=desc&page=${props.page}&per_page=${props.limit}`,
    );

    if (!responses.ok) {
      const message = `An error has occured: ${responses.status}`;
      throw new Error(`Error: NearBlocks's getTxFtList ${message}`);
    }

    const ftList: IOFtList_Output = await responses.json();
    return ftList;
  }

  async getTxNftList(props: IOTxList_Input): Promise<IOFtList_Output> {
    const responses = await fetch(
      `${this.apiURL}/account/${props.address}/nft-txns?&order=desc&page=${props.page}&per_page=${props.limit}`,
    );

    if (!responses.ok) {
      const message = `An error has occured: ${responses.status}`;
      throw new Error(`Error: NearBlocks's getTxNftList ${message}`);
    }

    const res = await responses.json();
    return res;
  }

  async fetchAllTx(props: IOTxList_Input): Promise<
    {
      transaction_hash: string;
      block_timestamp: string;
      source_type: ETxSourceType;
    }[]
  > {
    const res = await Promise.allSettled([
      this.getTxList(props).then((item) =>
        item.txns.map((item) => {
          return {
            ...item,
            source_type: ETxSourceType["general-transactions"],
          };
        }),
      ),
      this.getTxFtList(props).then((item) =>
        item.txns.map((item) => {
          return {
            ...item,
            source_type: ETxSourceType["ft-transactions"],
          };
        }),
      ),
      this.getTxNftList(props).then((item) =>
        item.txns.map((item) => {
          return {
            ...item,
            source_type: ETxSourceType["nft-transactions"],
          };
        }),
      ),
    ]);
    return res.flatMap((a) => {
      if (a.status === "fulfilled") {
        return a.value;
      } else {
        return [];
      }
    });
  }

  async getAccountIds(props: IOAccountList_Input): Promise<IOAccountList_Output> {
    const responses = await fetch(`${this.apiURL}/keys/${props.public_key}`);

    if (!responses.ok) {
      const message = `An error has occured: ${responses.status}`;
      throw new Error(`Error: NearBlocks's getAccountIds ${message}`);
    }

    const res = await responses.json();
    return res;
  }
}
