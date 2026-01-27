import { smallGreyText } from "../../ui/tailwind-vars";
import { SendTx } from "./wallet-action/SendTx";
import { SignMessage } from "./wallet-action/SignMessage";
import { type IPropsWalletAction } from "./wallet-action/wallet-action.types";

export const WalletActions = (actionProps: IPropsWalletAction) => {
  return (
    <div className={"flex flex-col align-stretch gap-4"}>
      <p className={smallGreyText}>Wallet Actions</p>
      <div className={"flex flex-col flex-justify-stretch gap-4"}>
        <SignMessage {...actionProps} />
        <SendTx {...actionProps} />
      </div>
    </div>
  );
};
