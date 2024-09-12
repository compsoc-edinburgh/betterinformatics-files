import * as React from "react";
import { RouteComponentProps } from "react-router-dom";
// Time after which we stop searching for the target element
const JUMP_TIMEOUT = 40_000;

// Currently there is no typescript type for react router dom exposed - we only need the hash attribute of location
// This element has to be the component of a route where the effect should be applied
/**
 * A component that can be used as a component of a route, that manages hash location jumps.
 * Should only exist once. Multiple instances will interfere with each other.
 * Is based on: https://gist.github.com/gajus/0bbc78135d88a02c18366f12237011a5
 */
const HashLocationHandler: React.FC<RouteComponentProps> = ({
  location: { hash },
}) => {
  // Remove # by using substr. Will result in empty string if hash === ""
  // Chrome doesn't decodeURIComponent hash whereas Safari does - this could cause problems when hash contains uri-decodable data after uri-decoding it.
  const hashLocation = decodeURIComponent(hash.substr(1));
  React.useEffect(() => {
    // Stop searching for the element we were previously searching for
    let disconnect: (() => void) | undefined = undefined;

    // An empty hash location will reset state (See above) but will not search for any element
    if (hashLocation === "") return;

    const tryScroll = () => {
      const element = document.getElementById(hashLocation);
      if (element === null) return;

      element.scrollIntoView({ behavior: "smooth" });

      // We found the element - previous refers to current element in this case
      if (disconnect) disconnect();
    };

    const observer = new MutationObserver(tryScroll);
    disconnect = () => observer.disconnect();
    observer.observe(document, {
      attributes: true,
      childList: true,
      subtree: true,
    });

    const timeout = window.setTimeout(() => {
      if (disconnect) disconnect();
    }, JUMP_TIMEOUT);

    // Try scrolling once if the element currently is present
    tryScroll();

    return () => {
      window.clearTimeout(timeout);
      disconnect?.();
    };
  }, [hashLocation]);
  return null;
};
export default HashLocationHandler;
