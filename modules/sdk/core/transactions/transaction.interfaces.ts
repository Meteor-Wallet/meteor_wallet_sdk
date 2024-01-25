import { MeteorTransaction } from "./MeteorTransaction.ts";

export interface IMeteorableTransaction {
  meteorTransaction?: MeteorTransaction;
  toMeteor(): MeteorTransaction;
}
