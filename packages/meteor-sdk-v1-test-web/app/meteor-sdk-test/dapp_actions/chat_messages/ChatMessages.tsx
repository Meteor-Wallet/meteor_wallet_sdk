import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useImmer } from "use-immer";
import {
  addMessage,
  getMessages,
  type IAddMessage,
} from "~/meteor-sdk-test/dapp_actions/chat_messages/chat_messages.func";

export function ChatMessages() {
  const walletSelector = useWalletSelector();

  const query_messages = useQuery({
    queryKey: ["get_messages"],
    queryFn: async () => {
      return getMessages(walletSelector);
    },
  });

  const [messageToSend, updateMessage] = useImmer<IAddMessage & { withDonation: boolean }>({
    message: "",
    donation: "0.001",
    withDonation: false,
    multiple: false,
    blankTransaction: false,
    signOnly: false,
    asDelegate: false,
  });

  const mutate_addMessage = useMutation({
    mutationKey: [messageToSend],
    mutationFn: async () => {
      return addMessage(walletSelector, {
        ...messageToSend,
        donation: messageToSend.withDonation ? messageToSend.donation : "0",
      });
    },
  });

  console.log("messageToSend", messageToSend);

  return (
    <div className="w-full space-y-6">
      <div className="rounded-3xl border border-gray-200 p-6 dark:border-gray-700 space-y-4">
        <h2 className="text-xl font-semibold">Add Message</h2>
        <div className="flex flex-col gap-2 items-start">
          <input
            type="text"
            placeholder="Message"
            className="rounded-3xl border border-gray-200 p-2 dark:border-gray-700"
            value={messageToSend.message}
            onChange={(e) => {
              updateMessage((draft) => {
                draft.message = e.target.value;
              });
            }}
          />
          <div className={"flex items-center gap-2"}>
            <label htmlFor={"withDonation"} className={"text-sm"}>
              Donation
            </label>
            <input
              id={"withDonation"}
              name="withDonation"
              type="checkbox"
              checked={messageToSend.withDonation}
              onChange={(e) => {
                updateMessage((draft) => {
                  draft.withDonation = e.target.checked;
                });
              }}
            />
          </div>
          <input
            type="text"
            placeholder="Donation"
            className="rounded-3xl border border-gray-200 p-2 dark:border-gray-700"
            value={messageToSend.donation}
            onChange={(e) => {
              updateMessage((draft) => {
                draft.donation = e.target.value;
              });
            }}
          />
          <div className={"flex items-center gap-2"}>
            <label htmlFor={"multiple"} className={"text-sm"}>
              Multiple
            </label>
            <input
              id={"multiple"}
              name="multiple"
              type="checkbox"
              checked={messageToSend.multiple}
              onChange={(e) => {
                updateMessage((draft) => {
                  draft.multiple = e.target.checked;
                });
              }}
            />
          </div>
          <div className={"flex items-center gap-2"}>
            <label htmlFor={"sign-only"} className={"text-sm"}>
              Sign Only
            </label>
            <input
              id={"sign-only"}
              name="sign-only"
              type="checkbox"
              checked={messageToSend.signOnly}
              onChange={(e) => {
                updateMessage((draft) => {
                  draft.signOnly = e.target.checked;
                });
              }}
            />
          </div>
          <div className={"flex items-center gap-2"}>
            <label htmlFor={"blank-transaction"} className={"text-sm"}>
              Blank Transaction (Only Actions with Receiver)
            </label>
            <input
              id={"blank-transaction"}
              name="blank-transaction"
              type="checkbox"
              checked={messageToSend.blankTransaction}
              onChange={(e) => {
                updateMessage((draft) => {
                  draft.blankTransaction = e.target.checked;
                });
              }}
            />
          </div>
          <div className={"flex items-center gap-2"}>
            <label htmlFor={"as-delegate"} className={"text-sm"}>
              As Delegate Action
            </label>
            <input
              id={"as-delegate"}
              name="as-delegate"
              type="checkbox"
              checked={messageToSend.asDelegate}
              onChange={(e) => {
                updateMessage((draft) => {
                  draft.asDelegate = e.target.checked;
                });
              }}
            />
          </div>
          <button
            disabled={mutate_addMessage.isPending}
            onClick={async () => {
              await mutate_addMessage.mutateAsync();
              updateMessage((draft) => {
                draft.message = "";
              });
              await query_messages.refetch({
                cancelRefetch: true,
              });
            }}
            className={"rounded-3xl bg-blue-600 text-white py-2 px-4"}
          >
            {mutate_addMessage.isPending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
      {query_messages.isPending && <p>Loading messages...</p>}
      {query_messages.isError && <p>Error loading messages: {query_messages.error.message}</p>}
      {query_messages.isSuccess && (
        <div className="rounded-3xl border border-gray-200 p-6 dark:border-gray-700 space-y-4">
          <h2 className="text-xl font-semibold">Messages</h2>
          <ul>
            {query_messages.data.map((message, index) => (
              <li
                key={`${JSON.stringify(message)}-${index}`}
                className="text-gray-700 dark:text-gray-300 mt-2 width-full border-b border-gray-200 pb-2 dark:border-gray-700 flex flex-col"
              >
                <span>{message.text}</span>
                <span className={"text-xs"}>{message.sender}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
