import * as React from "react";

export function listenForKey<T>(
  callback: Function,
  key: string,
  ctrl: boolean,
) {
  return (ev: React.KeyboardEvent<T>) => {
    if (ev.key === key && ev.ctrlKey === ctrl) {
      callback();
    }
  };
}

export function listenEnter<T>(callback: Function, ctrl?: boolean) {
  return listenForKey<T>(callback, "Enter", ctrl || false);
}
