import { describe, it } from "bun:test";
import { beforeEach } from "node:test";
import { ENearNetwork } from "../../near/types/near_basic_types";
import { NearPublicIndexer_PostgresClient } from "../clients/postgres/NearPublicIndexer_PostgresClient";

describe("indexer", () => {
  beforeEach(() => {
    // jest.resetModules();
  });

  it("can get from testnet", async () => {
    const db = new NearPublicIndexer_PostgresClient(ENearNetwork.testnet);
    // const client = new NearIndexerClinet(ENetwork.TESTNET)
    const results = await db.getRelatedTransaction({
      accountId: "kira-dev.testnet",
      limit: 10,
    });
    console.log(results);
    // expect(results.length).toBeGreaterThan(0)
    // expect(results.length).toBeLessThanOrEqual(10)
    // expect(results[0]!.actions!.length).toBeGreaterThan(0)
  });

  // have bug from prisma https://github.com/prisma/prisma/issues/11831

  // it('can get from mainnet', async () => {
  //   const client = new NearIndexerClinet(ENetwork.MAINNET)
  //   const results = await client.getAllRelatedTrxs({ accountId: "kira-baker.near", limit: 10, offset: 0 })
  //   expect(results.length).toBeGreaterThan(0)
  //   expect(results.length).toBeLessThanOrEqual(10)
  //   expect(results[0]!.actions!.length).toBeGreaterThan(0)
  // })
});
