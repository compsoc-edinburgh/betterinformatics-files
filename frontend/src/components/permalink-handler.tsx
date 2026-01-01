import * as React from "react";
import { useLocation } from "react-router-dom";
// Time after which we stop searching for the target element
const JUMP_TIMEOUT = 40_000;

// This is based on hash-location-handler.tsx

const PermaLinkHandler: React.FC = () => {
  const {search} = useLocation();
  const searchParams = new URLSearchParams(search);
  const answer = searchParams.get("answer");
  const comment = searchParams.get("comment");
  React.useEffect(() => {
    // Stop searching for the element we were previously searching for
    let disconnect: (() => void) | undefined = undefined;

    const location = comment || answer || null;

    if (!location) return;

    const tryScroll = () => {
      const element = document.getElementById(location);
      if (element === null) return;

      element.scrollIntoView();

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
  }, [search]);
  return null;
};
export default PermaLinkHandler;
