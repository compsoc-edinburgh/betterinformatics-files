import { useState, useEffect } from "react";

const isSmall = () => window.innerWidth <= 450;

const useIsSmallDisplay = () => {
  const [smallDisplay, setSmallDisplay] = useState(isSmall);

  useEffect(() => {
    const updateWindowSize = () => {
      setSmallDisplay(isSmall);
    };

    window.addEventListener("resize", updateWindowSize);
    return () => {
      window.removeEventListener("resize", updateWindowSize);
    };
  });

  return smallDisplay;
};
export default useIsSmallDisplay;
