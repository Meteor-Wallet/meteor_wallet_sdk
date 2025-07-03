import isEqual from "fast-deep-equal";
import produce, { Draft } from "immer";
import { useCallback, useEffect, useRef, useState } from "react";

type Initializer<T> = T extends Function ? never : T | (() => T);
type Updater<T> = T extends Function ? never : ((s: Draft<T>, o: T) => void) | T;

export const useEditableCopy = <T>(
  initialValue: Initializer<T>,
  deps?: any[],
): [T, (updater: Updater<T>) => T, boolean] => {
  const valueRef = useRef<{
    val: T;
    original: T;
    isChanged: boolean;
    ord: number;
  }>({
    val: typeof initialValue === "function" ? initialValue() : initialValue,
    original: typeof initialValue === "function" ? initialValue() : initialValue,
    isChanged: false,
    ord: 0,
  });
  const [_, updateOrd] = useState(valueRef.current.ord);

  useEffect(() => {
    if (!isEqual(initialValue, valueRef.current.original)) {
      valueRef.current.val = typeof initialValue === "function" ? initialValue() : initialValue;
      valueRef.current.original =
        typeof initialValue === "function" ? initialValue() : initialValue;
      valueRef.current.isChanged = false;
      valueRef.current.ord += 1;
      updateOrd(valueRef.current.ord);
    }
  }, deps ?? []);

  return [
    valueRef.current.val,
    useCallback((updater) => {
      valueRef.current.ord++;

      if (typeof updater === "function") {
        valueRef.current.val = produce(valueRef.current.val, (s) => {
          updater(s, valueRef.current.val);
        });
      } else {
        valueRef.current.val = updater as T;
      }

      valueRef.current.isChanged = !isEqual(valueRef.current.val, valueRef.current.original);
      updateOrd(valueRef.current.ord);
      return valueRef.current.val;
    }, []),
    valueRef.current.isChanged,
  ];
};
