import { NearConnector, type NearWalletBase } from "@hot-labs/near-connect";
import { type NearNep413MessagePayload, serializeMessageNep413 } from "@meteorwallet/sdk";
import { wait_utils } from "@meteorwallet/utils/javascript_helpers/wait.utils";
import { PublicKey } from "@near-js/crypto";
import { base64 } from "@scure/base";
import { useMemo, useState } from "react";
import { NetworkSelector } from "~/pages/near-connect/NetworkSelector";
import { WalletActions } from "~/pages/near-connect/WalletActions";
import { Button } from "~/ui/Button";
import type { INearSignMessageParams } from "../../../../meteor-sdk-v1/src/MeteorConnect/action/mc_action.near";
import { createSimpleNonce, GUESTBOOK_CONTRACT_ID } from "../meteor-sdk-test/guestbook";
import { devManifest } from "./dev-manifest";

export const NearConnectTest = () => {
  const [network, setNetwork] = useState<"testnet" | "mainnet">("testnet");
  const [account, _setAccount] = useState<{ id: string; network: "testnet" | "mainnet" }>();
  const [wallet, setWallet] = useState<NearWalletBase | undefined>();

  const [messageToSign, setMessageToSign] = useState<NearNep413MessagePayload>(() => ({
    message: "Hello",
    recipient: "Demo app",
    nonce: createSimpleNonce(),
  }));

  const logger = {
    log: (args: any) => console.log("[NearConnector]", args),
  };

  function setAccount(account: { accountId: string } | undefined) {
    if (account == null) return _setAccount(undefined);

    _setAccount({
      id: account.accountId,
      network: account.accountId.endsWith("testnet") ? "testnet" : "mainnet",
    });
  }

  const [connector] = useState<NearConnector>(() => {
    const connector = new NearConnector({
      manifest: devManifest(process.env.NODE_ENV === "production"),
      providers: { mainnet: ["https://relmn.aurora.dev"] },
      network,
      logger,
    });

    connector.on("wallet:signIn", async (t) => {
      if (t.source === "signIn") {
        setWallet(await connector.wallet());
        setAccount(t.accounts[0]);
      }
    });

    connector.on("wallet:signInAndSignMessage", async (t) => {
      setWallet(await connector.wallet());
      setAccount(t.accounts[0]);

      const signedMessage = t.accounts[0].signedMessage;

      console.log(
        "Received signInAndSignMessage event with account[0] signed message:",
        signedMessage,
      );

      const messageSerialized = serializeMessageNep413(messageToSign);

      const publicKey = PublicKey.from(signedMessage.publicKey);
      const isValid = publicKey.verify(messageSerialized, base64.decode(signedMessage.signature));

      console.log(`Is verified: ${isValid}`);
    });

    connector.on("wallet:signOut", async () => {
      setWallet(undefined);
      setAccount(undefined);
    });

    connector
      .wallet()
      .then(async (wallet) => {
        wallet.getAccounts().then((t) => {
          setAccount(t[0]);
          setWallet(wallet);
        });
      })
      .catch((e) => {
        console.error(e);
      });

    return connector;
  });

  const networkAccount = useMemo(
    () => (account != null && account.network === network ? account : undefined),
    [account, network],
  );

  const connectOrDisconnect = async (signMessageParams?: INearSignMessageParams) => {
    if (networkAccount != null) return connector.disconnect();
    await connector.connect({ signMessageParams });
  };

  return (
    <div className={"p-5"}>
      <h1>NEAR Connect Test</h1>
      <NetworkSelector
        network={network}
        onSelectNetwork={(network) => {
          setNetwork(network);
          connector.switchNetwork(network);
        }}
      />
      <div className="p-5 flex flex-row flex-wrap gap-2 items-start">
        <Button
          onClick={() => {
            connectOrDisconnect();
          }}
        >
          {networkAccount != null ? `${networkAccount.id} (logout)` : "Connect"}
        </Button>
        {networkAccount == null && (
          <>
            <Button
              onClick={() => {
                connectOrDisconnect(messageToSign);
              }}
            >
              Connect And Sign Message
            </Button>
            <Button
              onClick={async () => {
                await connectOrDisconnect();
                const wal = await connector.wallet();

                console.log("Signing message after connect (5 second delay)...");

                await wait_utils.waitSeconds(5);

                await wal.signMessage({
                  message: "Hello from Meteor Connect!",
                  nonce: createSimpleNonce(),
                  recipient: GUESTBOOK_CONTRACT_ID,
                });
              }}
            >
              {"Connect and Immediate Sign Message"}
            </Button>
          </>
        )}
      </div>

      {networkAccount != null && <WalletActions wallet={wallet!} network={network} />}
    </div>
  );
};
