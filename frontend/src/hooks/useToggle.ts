import { useCallback, useState } from "react";

const useToggle = (initialValue: boolean = false) => {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(<T>(value?: T) => {
    if (typeof value === "boolean") {
      setValue(value);
    } else {
      setValue(v => !v);
    }
  }, []);
  return [value, toggle] as const;
};
export type Toggle = <T>(value?: boolean | T | undefined) => void;
export default useToggle;
