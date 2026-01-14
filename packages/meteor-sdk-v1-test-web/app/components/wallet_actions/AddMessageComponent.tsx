import { useImmer } from "use-immer";
import { Button } from "~/ui/Button.tsx";

export interface IAddMessageParams {
  message: string;
  donation: string;
  withDonation: boolean;
  multiple: boolean;
}

interface ICPAddMessageComponent {
  disabled?: boolean;
  onPressAddMessage(params: IAddMessageParams): void;
}

export const AddMessageComponent = ({
  onPressAddMessage,
  disabled = false,
}: ICPAddMessageComponent) => {
  const [messageParams, updateMessageParams] = useImmer<IAddMessageParams>({
    message: "",
    donation: "0.001",
    withDonation: false,
    multiple: false,
  });

  return (
    <div className="rounded-3xl border border-gray-200 p-6 dark:border-gray-700 space-y-4">
      <h2 className="text-xl font-semibold">Add Message</h2>
      <div className="flex flex-col gap-2 items-start">
        <input
          type="text"
          placeholder="Message"
          className="rounded-3xl border border-gray-200 p-2 dark:border-gray-700"
          value={messageParams.message}
          onChange={(e) => {
            updateMessageParams((draft) => {
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
            checked={messageParams.withDonation}
            onChange={(e) => {
              updateMessageParams((draft) => {
                draft.withDonation = e.target.checked;
              });
            }}
          />
        </div>
        <input
          type="text"
          placeholder="Donation"
          className="rounded-3xl border border-gray-200 p-2 dark:border-gray-700"
          value={messageParams.donation}
          onChange={(e) => {
            updateMessageParams((draft) => {
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
            checked={messageParams.multiple}
            onChange={(e) => {
              updateMessageParams((draft) => {
                draft.multiple = e.target.checked;
              });
            }}
          />
        </div>
        <Button
          disabled={disabled}
          onClick={() => {
            onPressAddMessage(messageParams);
          }}
        >
          Send Message
        </Button>
      </div>
    </div>
  );
};
