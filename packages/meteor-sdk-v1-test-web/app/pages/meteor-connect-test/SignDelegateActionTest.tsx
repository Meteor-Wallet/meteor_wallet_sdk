import type { IMeteorConnectAccount, MeteorConnect } from "@meteorwallet/sdk";
import { KeyType, PublicKey } from "@near-js/crypto";
import { actionCreators, SignedDelegate } from "@near-js/transactions";
import { parseNearAmount } from "@near-js/utils";
import { base58 } from "@scure/base";
import { useMutation } from "@tanstack/react-query";
import { useLocalStorage } from "usehooks-ts";
import { Button } from "~/ui/Button";

BigInt.prototype["toJSON"] = function () {
  return `${this.toString()}`;
};

export const SignDelegateActionTest = ({
  account,
  meteorConnect,
}: {
  account: IMeteorConnectAccount;
  meteorConnect: MeteorConnect;
}) => {
  const [signedDelegates, setSignedDelegates] = useLocalStorage<SignedDelegate[] | undefined>(
    "sign_delegate_action_test",
    undefined,
  );

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
            ...(multiple
              ? [
                  {
                    receiverId: "pebble.testnet",
                    actions: [actionCreators.transfer(BigInt(parseNearAmount("0.001")!))],
                  },
                ]
              : []),
          ],
        },
      });

      return await action.promptForExecution();
    },
  });

  const mutate_testRelayDelegateAction = useMutation({
    mutationKey: ["mutate_testRelayDelegateAction", signedDelegates],
    mutationFn: async () => {
      if (!signedDelegates) {
        throw new Error("No signed delegates to test");
      }

      const response = await fetch("http://localhost:8787/test-relayed-transaction", {
        body: JSON.stringify({
          signedDelegates,
        }),
        method: "POST",
      });

      const json = await response.json();

      console.log("Relay response", json);
    },
  });

  return (
    <div className="p-5 flex flex-col gap-2 border border-gray-200 dark:border-gray-700 rounded-lg">
      <code>Send 0.001 NEAR to pebble.testnet</code>
      <Button
        onClick={async () => {
          const response = await mutate_signDelegateAction.mutateAsync(false);
          console.log("Signed delegate action response", response);

          const publicKey = new PublicKey({
            keyType: KeyType.ED25519,
            data: Uint8Array.from(
              response.signedDelegatesWithHashes[0].signedDelegate.delegateAction.publicKey
                .ed25519Key!.data!,
            ),
          });

          console.log("Public key string", publicKey.toString());

          setSignedDelegates(response.signedDelegatesWithHashes.map((d) => d.signedDelegate));
        }}
      >
        Test Signed Delegate Action
      </Button>
      <Button
        onClick={async () => {
          const response = await mutate_signDelegateAction.mutateAsync(true);
          console.log("Signed (multiple) delegate action response", response);
          setSignedDelegates(response.signedDelegatesWithHashes.map((d) => d.signedDelegate));
        }}
      >
        Test Signed Delegate Action (multiple)
      </Button>
      {signedDelegates && (
        <div>
          <code>Signed Delegates:</code>
          {mutate_testRelayDelegateAction.isPending && <div>Testing relay...</div>}
          <Button
            disabled={mutate_testRelayDelegateAction.isPending}
            onClick={() => mutate_testRelayDelegateAction.mutateAsync()}
          >
            Test Relaying Signed Delegates
          </Button>
          <pre>{JSON.stringify(signedDelegates, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
