import { EMeteorWalletSignInType } from "@meteorwallet/sdk";
import type { Account, InjectedWallet, WalletBehaviourFactory } from "@near-wallet-selector/core";
import type { MeteorWalletParams_Injected } from "~/core/meteor-wallet/meteor-wallet-types";
import { nullEmpty } from "~/core/meteor-wallet/setup/nullEmpty";
import { setupMeteorWalletState } from "~/core/meteor-wallet/setup/setupMeteorWalletState";

export const createMeteorWalletInjected: WalletBehaviourFactory<
  InjectedWallet,
  { params: MeteorWalletParams_Injected }
> = async ({ options, logger, store, params, metadata }) => {
  const _state = await setupMeteorWalletState(params, options.network);

  const getAccounts = async (): Promise<Array<Account>> => {
    const accountId = _state.wallet.getAccountId();
    const account = await _state.wallet.account();

    if (nullEmpty(accountId) || account == null) {
      return [];
    }

    const publicKey = await account.getSigner()!.getPublicKey();
    return [
      {
        accountId,
        publicKey: publicKey ? publicKey.toString() : "",
      },
    ];
  };

  return {
    async signIn({ contractId, methodNames = [] }) {
      logger.log("MeteorWallet:signIn", {
        contractId,
        methodNames,
      });

      if (methodNames.length) {
        await _state.wallet.requestSignIn({
          methods: methodNames,
          type: EMeteorWalletSignInType.SELECTED_METHODS,
          contract_id: contractId ?? "",
        });
      } else {
        await _state.wallet.requestSignIn({
          type: EMeteorWalletSignInType.ALL_METHODS,
          contract_id: contractId ?? "",
        });
      }

      const accounts = await getAccounts();

      logger.log("MeteorWallet:signIn", {
        contractId,
        methodNames,
        account: accounts[0],
      });

      return accounts;
    },

    async signOut() {
      if (_state.wallet.isSignedIn()) {
        await _state.wallet.signOut();
      }
    },

    async isSignedIn() {
      if (!_state.wallet) {
        return false;
      }

      return _state.wallet.isSignedIn();
    },

    async getAccounts() {
      return getAccounts();
    },

    async verifyOwner({ message }) {
      logger.log("MeteorWallet:verifyOwner", { message });

      const response = await _state.wallet.verifyOwner({
        message,
      });

      if (response.success) {
        return response.payload;
      } else {
        throw new Error(`Couldn't verify owner: ${response.message}`);
      }
    },

    async signMessage({ message, nonce, recipient, state }) {
      logger.log("MeteorWallet:signMessage", {
        message,
        nonce,
        recipient,
        state,
      });
      const accountId = _state.wallet.getAccountId();
      const response = await _state.wallet.signMessage({
        message,
        nonce,
        recipient,
        accountId,
        state,
      });
      if (response.success) {
        return response.payload;
      } else {
        throw new Error(`Couldn't sign message owner: ${response.message}`);
      }
    },

    async signAndSendTransaction({ signerId, receiverId, actions }) {
      logger.log("MeteorWallet:signAndSendTransaction", {
        signerId,
        receiverId,
        actions,
      });

      const { contract } = store.getState();

      if (!_state.wallet.isSignedIn()) {
        throw new Error("Wallet not signed in");
      }

      if (!receiverId && !contract) {
        throw new Error("No receiver found to send the transaction to");
      }

      const account = await _state.wallet.account()!;

      return account.signAndSendTransaction_direct({
        receiverId: receiverId ?? contract!.contractId,
        actions,
      });
    },

    async signAndSendTransactions({ transactions }) {
      logger.log("MeteorWallet:signAndSendTransactions", {
        transactions,
      });

      if (!_state.wallet.isSignedIn()) {
        throw new Error("Wallet not signed in");
      }

      return _state.wallet.requestSignTransactions({
        transactions: transactions as any,
      });
    },

    async createSignedTransaction(receiverId, actions) {
      logger.log("createSignedTransaction", { receiverId, actions });

      throw new Error(`Method not supported by ${metadata.name}`);
    },

    async signTransaction(transaction) {
      logger.log("signTransaction", { transaction });

      throw new Error(`Method not supported by ${metadata.name}`);
    },

    async getPublicKey() {
      logger.log("getPublicKey", {});

      throw new Error(`Method not supported by ${metadata.name}`);
    },

    async signNep413Message(message, accountId, recipient, nonce, callbackUrl) {
      logger.log("signNep413Message", {
        message,
        accountId,
        recipient,
        nonce,
        callbackUrl,
      });

      throw new Error(`Method not supported by ${metadata.name}`);
    },

    async signDelegateAction(delegateAction) {
      logger.log("signDelegateAction", { delegateAction });

      throw new Error(`Method not supported by ${metadata.name}`);
    },

    buildImportAccountsUrl() {
      return `https://wallet.meteorwallet.app/batch-import?network=${_state.wallet._networkId}`;
    },
  };
};
