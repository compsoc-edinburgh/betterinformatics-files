import React, { useEffect, useRef } from "react";

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
    const parsedHTML = document.createRange().createContextualFragment(html);
    ref.current.innerHTML = "";
    ref.current.appendChild(parsedHTML);
  }, [ref, html]);

  return <div ref={ref} />;
};
