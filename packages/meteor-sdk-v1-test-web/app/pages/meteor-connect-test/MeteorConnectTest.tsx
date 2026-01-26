import { MeteorConnect } from "@meteorwallet/sdk";
import type { IMeteorConnectAccount } from "@meteorwallet/sdk/MeteorConnect/MeteorConnect.types.ts";
import { webpage_local_storage } from "@meteorwallet/sdk/ported_common/utils/storage/webpage/webpage_local_storage.ts";
import { actionCreators } from "@near-js/transactions";
import { parseNearAmount } from "@near-js/utils";
import { QueryClient, QueryClientProvider, useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  AddMessageComponent,
  type IAddMessageParams,
} from "~/components/wallet_actions/AddMessageComponent.tsx";
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
            const action = await meteorConnect.createAction({
              id: "near::sign_in",
              input: {
                target: {
                  blockchain: "near",
                  network,
                },
              },
            });

            // const availableTargets = action.getAllExecutionTargetConfigs();
            /*let target: TMeteorConnectionExecutionTarget = "v1_web";

            if (availableTargets.some((target) => target.executionTarget === "v1_ext")) {
              target = "v1_ext";
            }*/

            await action.promptForExecution();

            await accountQuery.refetch({ cancelRefetch: true });
          }}
        >
          Sign In
        </Button>
      ) : (
        <>
          <Button
            onClick={async () => {
              const action = await meteorConnect.createAction({
                id: "near::sign_out",
                input: {
                  target: account.identifier,
                },
              });

              await action.execute();

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

const SUGGESTED_DONATION = "0";
const BOATLOAD_OF_GAS = "30000000000000";

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
      const action = await meteorConnect.createAction({
        id: "near::sign_message",
        input: {
          messageParams: {
            message: "hello",
            nonce: createSimpleNonce(),
            recipient: GUESTBOOK_CONTRACT_ID,
          },
          target: account.identifier,
        },
      });

      const signed = await action.execute();
      console.log("Signed message:", signed);
      return signed;
    },
  });

  const mutate_addMessage = useMutation({
    mutationKey: ["mutate_addMessage", account.identifier],
    mutationFn: async (params: IAddMessageParams) => {
      const action = await meteorConnect.createAction({
        id: "near::sign_transactions",
        input: {
          target: account.identifier,
          transactions: [
            {
              actions: [
                actionCreators.functionCall(
                  "addMessage",
                  {
                    text: params.message,
                  },
                  BigInt(BOATLOAD_OF_GAS),
                  BigInt(parseNearAmount(params.donation)!),
                ),
              ],
              receiverId: GUESTBOOK_CONTRACT_ID,
            },
          ],
        },
      });

      return await action.execute();
    },
  });

  const mutate_verifyOwner = useMutation({
    mutationKey: ["verify_owner", account.identifier],
    mutationFn: async () => {
      const action = await meteorConnect.createAction({
        id: "near::verify_owner",
        input: {
          target: account.identifier,
          message: "TEST",
        },
      });

      return await action.execute();
    },
  });

  return (
    <div className={"p-5 flex flex-col gap-5 items-start"}>
      <h1>{account.identifier.accountId} Signed In</h1>
      <Button
        onClick={async () => {
          const signedMessage = await mutate_signMessage.mutateAsync();
          console.log(signedMessage);
        }}
      >
        Sign Message
      </Button>
      <Button
        onClick={async () => {
          const verified = await mutate_verifyOwner.mutateAsync();
          console.log(verified);
        }}
      >
        Verify Owner
      </Button>
      <AddMessageComponent
        onPressAddMessage={async (params) => {
          console.log("Adding message");
          const response = await mutate_addMessage.mutateAsync(params);
          console.log("Sign message response", response);
        }}
      />
    </div>
  );
};
