import { useEffect, useState } from "react";

const useDpr = () => {
  const [dpr, setDpr] = useState(window.devicePixelRatio);
  useEffect(() => {
    const listener = () => {
      setDpr(window.devicePixelRatio);
    };
    const media = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    media.addEventListener("change", listener);
    return () => {
      media.removeEventListener("change", listener);
    };
  }, [dpr]);
  return dpr;
};
export default useDpr;
