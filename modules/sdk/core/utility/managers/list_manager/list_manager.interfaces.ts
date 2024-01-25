import { OrdIdentity } from "./OrdIdentity";

export interface IEqualityCheckable<T> {
  isEqualTo(other: T): boolean;
}

export interface IOrdIdentifiable {
  // Using "_ord" with prefixed "_" because it's a property that
  // should not be used outside of certain internal situations
  _ord: OrdIdentity;
}

export interface IListManageable<T> extends IEqualityCheckable<T>, IOrdIdentifiable {
  getRuntimeUniqueKey: () => string | number;
}
