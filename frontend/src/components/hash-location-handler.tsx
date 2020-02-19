import * as React from "react";
// Time after which we stop searching for the target element
const JUMP_TIMEOUT = 40_0000;

// number returned by window.setTimeout
let timeout: number | undefined = undefined;
// Stop searching for the element we were previously searching for
let disconnectPrevious: (() => void) | undefined = undefined;
// Hash of previous location - we wont jump to the same element twice
let previousHash: string = "";

function handleLocationChange(hash: string) {
  if (previousHash === hash) return;
  previousHash = hash;

  // Reset state
  if (timeout !== undefined) window.clearTimeout(timeout);
  if (disconnectPrevious) disconnectPrevious();

  // An empty hash location will reset state (See above) but will not search for any element
  if (hash === "") return;

  timeout = window.setTimeout(() => {
    if (disconnectPrevious) disconnectPrevious();
  }, JUMP_TIMEOUT);

  const tryScroll = () => {
    const element = document.getElementById(hash);
    if (element === null) return;

    element.scrollIntoView({ behavior: "smooth" });

    // We found the element - previous refers to current element in this case
    if (disconnectPrevious) disconnectPrevious();
  };

  const observer = new MutationObserver(tryScroll);
  disconnectPrevious = () => observer.disconnect();
  observer.observe(document, {
    attributes: true,
    childList: true,
    subtree: true,
  });

  // Try scrolling once if the element currently is present
  tryScroll();
}

// Currently there is no typescript type for react router dom exposed - we only need the hash attribute of location
// This element has to be the component of a route where the effect should be applied
const HashLocationHandler: React.FC<{ location: { hash: string } }> = ({
  location: { hash },
}) => {
  const hashLocation = decodeURIComponent(hash.substr(1));
  // Remove # by using substr. Will result in empty string if hash === ""
  // Chrome doesn't decodeURIComponent hash whereas Safari does - this could cause problems when hash contains uri-decodable data after uri-decoding it.
  handleLocationChange(hashLocation);
  return null;
};
export default HashLocationHandler;
