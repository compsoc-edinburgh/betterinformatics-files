import React from "react";

export const hl = (w: string, idx: number[]) => {
  const a = [];
  let om = 0;
  for (const i of idx) {
    if (om < i) a.push(<span key={`nm${i}`}>{w.substring(om, i)}</span>);
    om = i + 1;
    a.push(
      <mark className="p-0" key={`m${i}`}>
        {w[i]}
      </mark>,
    );
  }
  if (om < w.length) a.push(<span key={"end"}>{w.substring(om)}</span>);
  return a;
};
