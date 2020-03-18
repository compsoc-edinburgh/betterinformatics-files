import { useState, useCallback } from "react";

const useSet = <T>(defaultValue?: Set<T>) => {
  const [value, setValue] = useState(() => defaultValue || new Set<T>());

  const addEntries = useCallback((...entries: T[]) => {
    setValue(prevSelected => {
      const copy = new Set(prevSelected);
      for (const entry of entries) copy.add(entry);
      return copy;
    });
  }, []);
  const deleteEntries = useCallback((...entries: T[]) => {
    setValue(prevSelected => {
      const copy = new Set(prevSelected);
      for (const entry of entries) copy.delete(entry);
      return copy;
    });
  }, []);
  return [value, addEntries, deleteEntries] as const;
};
export default useSet;
