import produce, { Draft } from "immer";
import { useCallback, useRef, useState } from "react";

export type DraftFunction<S> = (draft: Draft<S>) => void;
export type Updater<S> = (arg: S | DraftFunction<S>) => S;
export type ImmerHook<S> = [S, Updater<S>];

export function useImmerWithResponse<S = any>(initialValue: S | (() => S)): ImmerHook<S>;

export function useImmerWithResponse<S = any>(initialValue: S) {
  const valueRef = useRef<{ val: S; ord: number }>({
    val: typeof initialValue === "function" ? initialValue() : initialValue,
    ord: 0,
  });
  const [_, updateOrd] = useState(valueRef.current.ord);

  return [
    valueRef.current.val,
    useCallback(
      ((updater) => {
        valueRef.current.ord++;

        if (typeof updater === "function") {
          valueRef.current.val = produce(valueRef.current.val, updater as DraftFunction<S>);
        } else {
          valueRef.current.val = updater;
        }

        updateOrd(valueRef.current.ord);
        return valueRef.current.val;
      }) as Updater<S>,
      [],
    ),
  ];
}
