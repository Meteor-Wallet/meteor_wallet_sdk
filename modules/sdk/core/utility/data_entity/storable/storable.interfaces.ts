export interface IStorableDataOnly<D> {
  getStorableData(): D;
}

export interface IStorable<D> {
  readonly incomingStorableData?: D;
  readonly storableUniqueKey: Promise<string>;
  getStorableUniqueKey(): Promise<string>;
  getStorableData(): D;
}
