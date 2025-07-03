import { toYoctoNear } from "./near_formatting_utils";

const NEAR_STORAGE_COST_PER_BYTE = 1 / (1000 * 100);

export function convertStorageToNearCost(storageBytes: number): string {
  return toYoctoNear(`${(storageBytes ?? 0) * NEAR_STORAGE_COST_PER_BYTE}`);
}
