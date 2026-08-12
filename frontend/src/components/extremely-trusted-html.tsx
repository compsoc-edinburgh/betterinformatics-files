import React, { useEffect, useRef } from "react";

// This file takes many ideas from https://www.ghinda.net/article/script-tags/
// Thank you to Ionuț Colceriu for the original article and code!

// https://html.spec.whatwg.org/multipage/scripting.html
const runScriptTypes = [
  "application/javascript",
  "application/ecmascript",
  "application/x-ecmascript",
  "application/x-javascript",
  "text/ecmascript",
  "text/javascript",
  "text/javascript1.0",
  "text/javascript1.1",
  "text/javascript1.2",
  "text/javascript1.3",
  "text/javascript1.4",
  "text/javascript1.5",
  "text/jscript",
  "text/livescript",
  "text/x-ecmascript",
  "text/x-javascript",
];

// Run a script, and upon evaluation (or error), call the callback.
const runScript = (script: HTMLScriptElement, cb: () => void) => {
  const newScript = document.createElement("script");
  newScript.type = script.type || "text/javascript";
  // If the script is external, set handlers for load and error events
  if (script.src) {
    newScript.onload = e => {
      cb();
      script.onload?.(e);
    };
    newScript.onerror = e => {
      cb();
      script.onerror?.(e);
    };
    newScript.src = script.src;
  } else {
    newScript.textContent = script.textContent;
  }
  document.head.appendChild(newScript);
  script.parentNode?.removeChild(script);

  // If the script is inline, immediately call the callback after adding it to
  // the DOM
  if (!script.src) {
    cb();
  }
};

/**
 * Run a sequence of functions taking a callback, one after the other, then
 * call the final callback.
 * @param fns Functions to run in sequence
 * @param cb Callback to call after all functions have been run
 * @param index Leave undefined, used internally
 */
const sequence = (
  fns: ((cb: () => void) => void)[],
  cb: () => void,
  index?: number,
) => {
  index ??= 0;

  fns[index](() => {
    index ??= 0;
    index++;
    if (index < fns.length) {
      sequence(fns, cb, index);
    } else {
      cb();
    }
  });
};

/**
 * Render HTML and evaluate any scripts within it.
 * Only use for HTML when you are sure that if the submitter of HTML was
 * malicious, it would've been displayed to the user anyway through other means.
 * (i.e. an arbitrary user submitting HTML to be displayed with this component
 * should be as equally difficult as deploying a malicious version of
 * BetterInformatics)
 */
export const ExtremelyTrustedHTML: React.FC<{
  html: string;
}> = ({ html }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    // Add to DOM. This won't evaluate any scripts
    ref.current.innerHTML = html;

    // Collect all scripts that have no type attribute, or have a whitelisted
    // type attribute
    const scripts: ((cb: () => void) => void)[] = [];
    ref.current.querySelectorAll("script").forEach(script => {
      if (
        script.getAttribute("type") !== null &&
        !runScriptTypes.includes(script.type)
      )
        return;

      scripts.push(cb => {
        runScript(script, cb);
      });
    });

    // Call scripts in sequence, then dispatch a DOMContentLoaded event for
    // any scripts that listen for it. Will result in the event firing twice for
    // any pre-existing scripts on the page (pray that it's idempotent).
    sequence(scripts, () => {
      const event = new Event("DOMContentLoaded", {
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(event);
    });
  }, [ref, html]);

  return <div ref={ref} />;
};
