import { update } from "lodash";
import { useState, useEffect } from "react";

const useIsSmallDisplay = () => {

    const [smallDisplay, setSmallDisplay] = useState(false);

    useEffect(() => {
        const updateWindowSize = () => {
            setSmallDisplay(window.innerWidth <= 450);
        }
        updateWindowSize();

        window.addEventListener('resize', updateWindowSize);
        return () => { window.removeEventListener('resize', updateWindowSize); }
    });

    return smallDisplay;
};
export default useIsSmallDisplay;
