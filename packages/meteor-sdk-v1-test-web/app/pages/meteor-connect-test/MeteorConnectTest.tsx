import type { IMeteorConnectAccount } from "@meteorwallet/sdk";
import { MeteorConnect, webpage_local_storage } from "@meteorwallet/sdk";
import { wait_utils } from "@meteorwallet/utils/javascript_helpers/wait.utils";
import { actionCreators } from "@near-js/transactions";
import { parseNearAmount } from "@near-js/utils";
import { QueryClient, QueryClientProvider, useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  AddMessageComponent,
  type IAddMessageParams,
} from "~/components/wallet_actions/AddMessageComponent.tsx";
import { createSimpleNonce, GUESTBOOK_CONTRACT_ID } from "~/pages/meteor-sdk-test/guestbook";
import { NetworkSelector } from "~/pages/near-connect/NetworkSelector";
import { Button } from "~/ui/Button";

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

  console.log("Current account:", account);

  return (
    <div className={"p-5"}>
      <h1>Meteor Connect (bare Meteor SDK) Test</h1>
      <NetworkSelector
        network={network}
        onSelectNetwork={(network) => {
          setNetwork(network);
        }}
      />
      {account == null ? (
        <div className={"p-5 flex flex-row gap-5 items-start"}>
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

              await accountQuery.refetch({ cancelRefetch: true });
            }}
          >
            Sign In
          </Button>
          <Button
            onClick={async () => {
              const signInAction = await meteorConnect.createAction({
                id: "near::sign_in",
                input: {
                  target: {
                    blockchain: "near",
                    network,
                  },
                },
              });

              const newAccount = await signInAction.promptForExecution();

              await accountQuery.refetch({ cancelRefetch: true });

              const signMessageAction = await meteorConnect.createAction({
                id: "near::sign_message",
                input: {
                  messageParams: {
                    message: "Immediate sign message after sign in",
                    nonce: createSimpleNonce(),
                    recipient: GUESTBOOK_CONTRACT_ID,
                  },
                  target: newAccount.identifier,
                },
              });

              console.log("Prompting for sign message action immediately after sign in...");

              const signedMessage = await signMessageAction.promptForExecution();

              console.log("Signed message:", signedMessage);
            }}
          >
            Sign In With Immediate Sign Message
          </Button>
        </div>
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

              await action.promptForExecution();

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

      const signed = await action.promptForExecution();
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

      return await action.promptForExecution();
    },
  });

  const mutate_signDelegateAction = useMutation({
    mutationKey: ["mutate_signDelegateAction", account.identifier],
    mutationFn: async (multiple: boolean) => {
      const action = await meteorConnect.createAction({
        id: "near::sign_delegate_actions",
        input: {
          target: account.identifier,
          delegateActions: [
            {
              receiverId: "pebble.testnet",
              actions: [actionCreators.transfer(BigInt(parseNearAmount("0.001")!))],
            },
            {
              receiverId: "pebble.testnet",
              actions: [actionCreators.transfer(BigInt(parseNearAmount("0.001")!))],
            },
          ],
        },
      });

      return await action.promptForExecution();
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

      return await action.promptForExecution();
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
      <div className="p-5 flex flex-col gap-2 border border-gray-200 dark:border-gray-700 rounded-lg">
        <code>Send 0.001 NEAR to pebble.testnet</code>
        <Button
          onClick={async () => {
            const response = await mutate_signDelegateAction.mutateAsync(false);
            console.log("Signed delegate action response", response);
          }}
        >
          Test Signed Delegate Action
        </Button>
        <Button
          onClick={async () => {
            const response = await mutate_signDelegateAction.mutateAsync(true);
            console.log("Signed (multiple) delegate action response", response);
          }}
        >
          Test Signed Delegate Action (multiple)
        </Button>
      </div>
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

// At the bottom of MeteorConnectTest.tsx
if (import.meta.hot) {
  // Accept updates from the SDK specifically
  import.meta.hot.accept("@meteorwallet/sdk", (newModule) => {
    console.log("SDK change detected, skipping full reload.");
  });
}
