import { NearConnector, type NearWalletBase } from "@hot-labs/near-connect";
import { useMemo, useState } from "react";
import { NetworkSelector } from "~/pages/near-connect/NetworkSelector";
import { WalletActions } from "~/pages/near-connect/WalletActions";
import { Button } from "~/ui/Button";
import { devManifest } from "./dev-manifest";

export const NearConnectTest = () => {
  const [network, setNetwork] = useState<"testnet" | "mainnet">("testnet");
  const [account, _setAccount] = useState<{ id: string; network: "testnet" | "mainnet" }>();
  const [wallet, setWallet] = useState<NearWalletBase | undefined>();

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
      setWallet(await connector.wallet());
      setAccount(t.accounts[0]);
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

  const connectOrDisconnect = async () => {
    if (networkAccount != null) return connector.disconnect();
    await connector.connect();
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
      <Button
        onClick={() => {
          connectOrDisconnect();
        }}
      >
        {networkAccount != null ? `${networkAccount.id} (logout)` : "Connect"}
      </Button>
      {networkAccount != null && <WalletActions wallet={wallet!} network={network} />}
    </div>
  );
};
