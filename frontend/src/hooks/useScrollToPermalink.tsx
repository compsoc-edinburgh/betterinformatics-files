import * as React from "react";
import { useLocation } from "react-router-dom";
// Time after which we stop searching for the target element
const JUMP_TIMEOUT = 40_000;

/**
 * Sets up a MutationObserver for `document` to scroll to either a comment or
 * answer when it is found in the DOM, based on the respective URL parameters.
 *
 * **Should only be used once in the whole render tree.**
 */
export const useScrollToPermalink = () => {
  const {search} = useLocation();
  const searchParams = new URLSearchParams(search);
  const answer = searchParams.get("answer");
  const comment = searchParams.get("comment");
  React.useEffect(() => {
    // Stop searching for the element we were previously searching for
    let disconnect: (() => void) | undefined = undefined;

    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const location = comment || answer;

    if (!location) return;

    const tryScroll = () => {
      const element = document.getElementById(location);
      if (element === null) return;

      element.scrollIntoView();

      // Highlight the background for a split second.
      const oldColor = element.style.backgroundColor;
      element.style.backgroundColor = "color-mix(in srgb, var(--mantine-primary-color-filled) 30%, transparent)";

      // Request the browser to render the color at least one frame before
      // we apply the normal background color, otherwise we won't see it
      requestAnimationFrame(() => {
        element.style.transition = "background-color 300ms linear 1s";
        element.style.backgroundColor = oldColor;
      });

      // We found the element and drew attention, now disconnect so we don't
      // lock scroll
      if (disconnect) disconnect();
    };

    const observer = new MutationObserver(tryScroll);
    disconnect = () => observer.disconnect();
    observer.observe(document, {
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
  }, [answer, comment]);
};
