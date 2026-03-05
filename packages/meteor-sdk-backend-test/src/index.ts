import { Hono } from "hono";
import { cors } from "hono/cors";
import { Account, JsonRpcProvider, type KeyPairString } from "near-api-js";

const app = new Hono<{ Bindings: CloudflareBindings }>();

const relayerAccount = new Account(
  process.env.TEST_NEAR_RELAYER_ACCOUNT_ID!,
  new JsonRpcProvider({ url: "https://rpc.testnet.near.org" }),
  process.env.TEST_NEAR_RELAYER_PRIVATE_KEY! as KeyPairString,
);

app.use(cors());

app.get("/message", (c) => {
  return c.text(`Hello Hono! ${process.env.TEST_NEAR_RELAYER_ACCOUNT_ID}`);
});

app.post("/test-relayed-transaction", async (c) => {
  const body = await c.req.json();
  console.log("Received relayed transaction:", body);

  const outcomes: any[] = [];

  try {
    for (const signedDelegate of body.signedDelegates) {
      outcomes.push(await relayerAccount.relayMetaTransaction(signedDelegate));
    }
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }

  return c.json({ outcomes });
});

export default app;
