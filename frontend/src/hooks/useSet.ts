import { useCallback, useState } from "react";

const useSet = <T>(defaultValue?: Set<T>) => {
  const [value, setValue] = useState(() => defaultValue || new Set<T>());

  const addEntries = useCallback((...entries: T[]) => {
    setValue(prevSelected => {
      const copy = new Set(prevSelected);
      for (const entry of entries) copy.add(entry);
      if (copy.size === prevSelected.size) return prevSelected;
      return copy;
    });
  }, []);
  const deleteEntries = useCallback((...entries: T[]) => {
    setValue(prevSelected => {
      const copy = new Set(prevSelected);
      for (const entry of entries) copy.delete(entry);
      if (copy.size === prevSelected.size) return prevSelected;
      return copy;
    });
  }, []);
  const setEntries = useCallback((...entries: T[]) => {
    setValue(new Set(entries));
  }, []);
  return [value, addEntries, deleteEntries, setEntries] as const;
};
export default useSet;
