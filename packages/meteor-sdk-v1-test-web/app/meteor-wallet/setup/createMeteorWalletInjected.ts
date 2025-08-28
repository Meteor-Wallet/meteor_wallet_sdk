import { EMeteorWalletSignInType } from "@meteorwallet/sdk-v1";
import { PublicKey } from "@near-js/crypto";
import type { Account, InjectedWallet, WalletBehaviourFactory } from "@near-wallet-selector/core";
import type { MeteorWalletParams_Injected } from "~/meteor-wallet/meteor-wallet-types";
import { nullEmpty } from "~/meteor-wallet/setup/nullEmpty";
import { setupMeteorWalletState } from "~/meteor-wallet/setup/setupMeteorWalletState";

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

      return _state.wallet.requestSignAndSendTransactions({
        transactions,
      });
    },

    async createSignedTransaction(receiverId, actions) {
      logger.log("MeteorWallet:createSignedTransaction", { receiverId, actions });

      // if (!_state.wallet.isSignedIn()) {
      //   throw new Error("Wallet not signed in");
      // }
      //
      // return _state.wallet.requestCreateSignedTransactions({
      //   transactions,
      // });

      throw new Error(`Method not supported by ${metadata.name}`);
    },

    async signTransaction(transaction) {
      logger.log("signTransaction", { transaction });

      if (!_state.wallet.isSignedIn()) {
        throw new Error("Wallet not signed in");
      }

      const response = await _state.wallet.requestSignedTransactionsWithoutPublish({
        transactions: [transaction],
      });

      // response.transactions.map(s => s.)

      throw new Error(`Method not supported by ${metadata.name}`);
    },

    async getPublicKey() {
      logger.log("MeteorWallet:getPublicKey", {});

      const accounts = await getAccounts();

      if (accounts.length === 0) {
        throw new Error("Wallet is not signed in yet");
      }

      if (!accounts[0].publicKey) {
        throw new Error("Public key is not available for the selected account");
      }

      return PublicKey.fromString(accounts[0].publicKey);
    },

    async signNep413Message(message, accountId, recipient, nonce, callbackUrl) {
      logger.log("MeteorWallet:signNep413Message", {
        message,
        accountId,
        recipient,
        nonce,
        callbackUrl,
      });

      const response = await _state.wallet.signMessage({
        message,
        nonce,
        recipient,
        accountId,
      });

      if (response.success) {
        const { publicKey, accountId, signature } = response.payload;
        return {
          publicKey: PublicKey.from(publicKey),
          accountId: accountId,
          signature: new Uint8Array(Buffer.from(signature, "base64")),
        };
      } else {
        throw new Error(`Couldn't sign message: ${response.message}`);
      }
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
