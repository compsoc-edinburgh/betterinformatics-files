import React, { useEffect, useRef } from "react";

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

const runScript = (script: HTMLScriptElement, cb: () => void) => {
  const newScript = document.createElement("script");
  newScript.type = script.type || "text/javascript";
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

  if (!script.src) {
    cb();
  }
};

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
    ref.current.innerHTML = html;
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
