import { describe, expect, it } from "bun:test";
import { near_wallet_utils } from "./near_wallet_utils";

describe("nep0413 sign message", () => {
  it("should verify successfully when sign correctly", () => {
    const fak =
      "ed25519:2NoJqvZkgsAwm7kigB4QbwiQtdeK7xdBNQvvZ82qeYgMvguuTuggFKjFfaAcHiuidHQEuUmSU2RAQcNCRutUJbzH";
    const nonceBuffer = Buffer.from(Array.from(Array(32).keys()));
    const payload = {
      message: "sign message test",
      nonce: nonceBuffer,
      recipient: "meteor-test",
      callbackUrl: "https://localhost",
    };
    const signedMessage = near_wallet_utils.nep0413_signMessageWithAccountAndPrivateKey({
      accountId: "dev-1659223306990-29456453680390",
      privateKey: fak,
      state: "test-state",
      ...payload,
    });
    expect(
      near_wallet_utils.nep0413_verifySignedMessage({
        originalInputs: payload,
        signedPayload: signedMessage,
      }),
    ).toBe(true);
  });
});
