import {
  EErr_NearLedger,
  MeteorNearLedgerError,
} from "@meteorwallet/ledger-client/near/MeteorErrorNearLedger";
import type { NearLedgerClient } from "@meteorwallet/ledger-client/near/NearLedgerClient";
import { KeyPairEd25519 } from "@near-js/crypto";
import { FinalExecutionOutcome } from "@near-js/types";
import { IONearRpc_Query_ViewAccessKey_Output } from "../../../modules_external/near/types/near_rpc_types";
import { AsyncUtils } from "../../../modules_utility/javascript_helpers/AsyncUtils";
import {
  badFinalExecutionOutcome,
  goodFinalExecutionOutcome,
} from "./NearAccountSignerExecutor.test.static_data";
import { ESignerMethod, TSigner } from "./NearAccountSignerExecutor.types";

export class TestLedgerClient
  implements Pick<NearLedgerClient, "getVersion" | "getPublicKey" | "signTransactionBuffer">
{
  private keyPair: KeyPairEd25519 = KeyPairEd25519.fromRandom();
  private static instances: { [key: number]: TestLedgerClient } = {};
  private inc = 0;
  private getVersionInc = 0;
  private hasClientInitialized = false;

  private constructor() {}

  public static get(ordinal: number): TestLedgerClient {
    if (!TestLedgerClient.instances[ordinal]) {
      TestLedgerClient.instances[ordinal] = new TestLedgerClient();
    }
    return TestLedgerClient.instances[ordinal];
  }

  getSigner(): TSigner {
    return {
      publicKey: this.keyPair.publicKey.toString(),
      method: ESignerMethod.ledger,
      path: "m/44'/397'/0'/0'/0'",
    };
  }

  viewAccessKey(): IONearRpc_Query_ViewAccessKey_Output {
    return {
      block_hash: "7UcSSnYF7hcsoh8WwkhSK9R7sa1oCtrSBjf3V2YzBEmF",
      nonce: 128793287,
      block_height: 0,
      permission: "FullAccess",
    };
  }

  maybeThrowNextLedgerError(isSign: boolean) {
    this.inc++;

    if (this.inc < 2) {
      throw MeteorNearLedgerError.fromId(EErr_NearLedger.ledger_device_locked);
    }

    if (this.inc < 4) {
      throw MeteorNearLedgerError.fromId(EErr_NearLedger.ledger_near_app_not_open);
    }

    if (isSign && Math.random() < 0.1) {
      throw MeteorNearLedgerError.fromId(EErr_NearLedger.ledger_user_rejected_action);
    }
  }

  async initialize(): Promise<void> {
    this.maybeThrowNextLedgerError(false);
    this.hasClientInitialized = true;
  }

  client(): void {
    if (!this.hasClientInitialized) {
      throw new Error("Ledger client not initialized");
    }
  }

  finalExecutionOutcome(): FinalExecutionOutcome {
    if (Math.random() < 0.1) {
      return badFinalExecutionOutcome;
    }

    return goodFinalExecutionOutcome;
  }

  async getVersion(): Promise<string> {
    this.getVersionInc++;
    if (this.getVersionInc < 3) {
      throw new Error("TransportError");
    }
    return "x.x.x";
  }

  async getPublicKey(_path: string): Promise<{
    publicKey: string;
    address: string;
  }> {
    return {
      publicKey: this.keyPair.publicKey.toString(),
      address: "test",
    };
  }

  async signTransactionBuffer(_transactionData: Buffer, _path: string): Promise<Buffer> {
    this.maybeThrowNextLedgerError(true);
    await AsyncUtils.waitSeconds(Math.random() * 4 + 3);
    return Buffer.from(this.keyPair.sign(_transactionData).signature);
  }
}
