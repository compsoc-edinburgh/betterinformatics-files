import { useEffect, useState } from "react";

const useInitialState = <T>(prop: T) => {
  const [value, setValue] = useState(prop);
  useEffect(() => {
    setValue(prop);
  }, [prop]);
  return [value, setValue] as const;
};
export default useInitialState;
