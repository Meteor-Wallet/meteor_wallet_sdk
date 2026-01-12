import { MeteorConnect } from "@meteorwallet/sdk";
import { EMCActionId } from "@meteorwallet/sdk/MeteorConnect/MeteorConnect.action.types.ts";
import { webpage_local_storage } from "@meteorwallet/sdk/ported_common/utils/storage/webpage/webpage_local_storage.ts";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { NetworkSelector } from "~/pages/near-connect/NetworkSelector.tsx";
import { Button } from "~/ui/Button.tsx";

const meteorConnectClient = new MeteorConnect();

const initializedMeteorConnect = async (): Promise<MeteorConnect> => {
  meteorConnectClient.initialize({
    storage: webpage_local_storage,
  });

  return meteorConnectClient;
};

export const MeteorConnectTest = () => {
  const meteorConnectQuery = useQuery({
    queryKey: [],
    queryFn: initializedMeteorConnect,
  });

  if (meteorConnectQuery.data == null) {
    return <></>;
  }

  return <MeteorConnectTestInitialized meteorConnect={meteorConnectQuery.data} />;
};

const MeteorConnectTestInitialized = ({ meteorConnect }: { meteorConnect: MeteorConnect }) => {
  const [network, setNetwork] = useState<"testnet" | "mainnet">("testnet");
  // const [account, _setAccount] = useState<{ id: string; network: "testnet" | "mainnet" }>();

  const account = useQuery({
    queryKey: [network],
    queryFn: async () => {
      return meteorConnect.getAccount({
        blockchain: "near",
        network,
      });
    },
  });

  return (
    <div className={"p-5"}>
      <h1>NEAR Connect Test</h1>
      <NetworkSelector
        network={network}
        onSelectNetwork={(network) => {
          setNetwork(network);
        }}
      />
      {account.data == null ? (
        <Button
          onClick={async () => {
            await meteorConnect.makeRequest({
              actionId: EMCActionId.account_sign_in,
              connection: {
                platformTarget: "v1_web",
              },
              networkTarget: {
                blockchain: "near",
                network,
              },
            });
          }}
        >
          Sign In
        </Button>
      ) : (
        <Button
          onClick={async () => {
            await meteorConnect.makeRequest({
              actionId: EMCActionId.account_sign_out,
              connection: {
                platformTarget: "v1_web",
              },
              networkTarget: {
                blockchain: "near",
                network,
              },
            });
          }}
        >
          Sign Out
        </Button>
      )}
    </div>
  );
};

const MeteorConnectWithAccount = ({}: {}) => {
  return (
    <div className={"p-5"}>
      <h1>Signed In</h1>
    </div>
  );
};
