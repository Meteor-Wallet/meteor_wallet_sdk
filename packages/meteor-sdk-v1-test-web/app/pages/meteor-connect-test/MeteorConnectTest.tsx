import { MeteorConnect } from "@meteorwallet/sdk";
import type { IMCActionDef_Near_SignMessage } from "@meteorwallet/sdk/MeteorConnect/action/mc_action.near.types.ts";
import type { IMeteorConnectAccount } from "@meteorwallet/sdk/MeteorConnect/MeteorConnect.types.ts";
import { webpage_local_storage } from "@meteorwallet/sdk/ported_common/utils/storage/webpage/webpage_local_storage.ts";
import { QueryClient, QueryClientProvider, useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { createSimpleNonce, GUESTBOOK_CONTRACT_ID } from "~/pages/meteor-sdk-test/guestbook.ts";
import { NetworkSelector } from "~/pages/near-connect/NetworkSelector.tsx";
import { Button } from "~/ui/Button.tsx";

const meteorConnectClient = new MeteorConnect();

const initializedMeteorConnect = async (): Promise<MeteorConnect> => {
  meteorConnectClient.initialize({
    storage: webpage_local_storage,
  });

  return meteorConnectClient;
};

const queryClient = new QueryClient();

export const MeteorConnectTest = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <MeteorConnectTestInner />
    </QueryClientProvider>
  );
};

const MeteorConnectTestInner = () => {
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
  // const [account, setAccount] = useState<IMeteorConnectAccount | undefined>();

  const accountQuery = useQuery({
    queryKey: ["getAccount", network],
    queryFn: async () => {
      return {
        account: await meteorConnect.getAccount({
          blockchain: "near",
          network,
        }),
      };
    },
  });

  const account = accountQuery.data?.account;

  return (
    <div className={"p-5"}>
      <h1>NEAR Connect Test</h1>
      <NetworkSelector
        network={network}
        onSelectNetwork={(network) => {
          setNetwork(network);
        }}
      />
      {account == null ? (
        <Button
          onClick={async () => {
            await meteorConnect.actionRequest({
              actionId: "near::sign_in",
              connection: {
                platformTarget: "v1_web",
              },
              target: {
                blockchain: "near",
                network,
              },
            });

            await accountQuery.refetch({ cancelRefetch: true });
          }}
        >
          Sign In
        </Button>
      ) : (
        <>
          <Button
            onClick={async () => {
              await meteorConnect.actionRequest({
                actionId: "near::sign_out",
                target: account.identifier,
              });

              await accountQuery.refetch({ cancelRefetch: true });
            }}
          >
            Sign Out
          </Button>
          <MeteorConnectWithAccount account={account} meteorConnect={meteorConnect} />
        </>
      )}
    </div>
  );
};

const MeteorConnectWithAccount = ({
  account,
  meteorConnect,
}: {
  account: IMeteorConnectAccount;
  meteorConnect: MeteorConnect;
}) => {
  const mutate_signMessage = useMutation({
    mutationKey: ["mutate_signMessage", account.identifier, account.publicKeys],
    mutationFn: async () => {
      const response = await meteorConnect.actionRequest<IMCActionDef_Near_SignMessage>({
        actionId: "near::sign_message",
        messageParams: {
          message: "hello",
          nonce: createSimpleNonce(),
          recipient: GUESTBOOK_CONTRACT_ID,
        },
        target: account.identifier,
      });

      return response.outcome;
    },
  });

  return (
    <div className={"p-5"}>
      <h1>{account.identifier.accountId} Signed In</h1>
      <Button
        onClick={async () => {
          const signedMessage = await mutate_signMessage.mutateAsync();
          console.log(signedMessage);
        }}
      >
        Sign Message
      </Button>
    </div>
  );
};
