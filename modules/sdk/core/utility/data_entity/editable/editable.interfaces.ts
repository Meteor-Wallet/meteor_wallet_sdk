import { IWatchableProps } from "../watchable/watchable.interfaces.ts";

export interface IEditableAndWatchableProps<E extends object, W extends E = E>
  extends IWatchableProps<W> {
  updateEditable: (props: Partial<E>) => void;
  getEditableProps: () => E;
}
