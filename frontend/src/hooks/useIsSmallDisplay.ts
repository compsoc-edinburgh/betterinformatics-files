import { useEffect, useState } from "react";

const useIsSmallDisplay = () => {
  const [smallDisplay, setSmallDisplay] = useState(false);
  useEffect(() => {
    setSmallDisplay(window.innerWidth < 450);
  }, [window.innerWidth]);
  return smallDisplay;
};
export default useIsSmallDisplay;
