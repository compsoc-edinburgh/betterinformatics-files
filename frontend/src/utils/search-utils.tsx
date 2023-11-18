import React from "react";

export const highlight = (text: string, indexArray: number[]) => {
  const res = [];
  let prevMatchingIndex = 0;
  for (const i of indexArray) {
    if (prevMatchingIndex < i)
      res.push(
        // nm = non-matching
        <span key={`nm${i}`}>{text.substring(prevMatchingIndex, i)}</span>,
      );
    prevMatchingIndex = i + 1;
    res.push(
      // m = matching
      <mark key={`m${i}`}>{text[i]}</mark>,
    );
  }
  if (prevMatchingIndex < text.length)
    res.push(<span key="end">{text.substring(prevMatchingIndex)}</span>);
  return res;
};
