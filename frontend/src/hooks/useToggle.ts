import { useCallback, useState } from "react";

const useToggle = (initialValue: boolean = false) => {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback((value?: unknown) => {
    if (typeof value === "boolean") {
      setValue(value);
    } else {
      setValue(v => !v);
    }
  }, []);
  return [value, toggle] as const;
};
export type Toggle = (value?: unknown) => void;
export default useToggle;
