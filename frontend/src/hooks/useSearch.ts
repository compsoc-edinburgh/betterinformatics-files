import { useMemo } from "react";

function minScore(a: string, b: string) {
  const ac = a.toLowerCase();
  const bc = b.toLowerCase();
  const m = a.length;
  const n = b.length;

  const cost = new Uint8ClampedArray((m + 1) * (n + 1));
  const pred = new Uint8ClampedArray((m + 1) * (n + 1));
  const lm = new Uint8ClampedArray((m + 1) * (n + 1));
  for (let i = 1; i <= m; i++) {
    cost[(n + 1) * i] = 9;
  }
  for (let j = 1; j <= n; j++) {
    cost[j] = 255;
  }
  for (let j = 1; j <= n; j++) {
    for (let i = 1; i <= m; i++) {
      let sCost = 10;
      const q = ac[i - 1] === bc[j - 1];
      if (q) {
        sCost = 3;
      }
      const t = lm[(n + 1) * (i - 1) + (j - 1)];
      if (q && t === i - 1) {
        sCost = -1;
      }
      if (q && (i === 1 || ac[i - 2] === " ")) {
        sCost = -2;
      }

      const sa = cost[(n + 1) * (i - 1) + j] + 0;
      const sb = cost[(n + 1) * i + (j - 1)] + Math.max(9 - bc.length, 5);
      const sc = cost[(n + 1) * (i - 1) + (j - 1)] + sCost;
      cost[(n + 1) * i + j] = Math.min(sa, sb, sc);
      if (sa < sb && sa < sc) {
        pred[(n + 1) * i + j] = 0;
        lm[(n + 1) * i + j] = lm[(n + 1) * (i - 1) + j];
      } else if (sb < sc) {
        pred[(n + 1) * i + j] = 1;
        lm[(n + 1) * i + j] = lm[(n + 1) * i + (j - 1)];
      } else {
        pred[(n + 1) * i + j] = q ? 2 : 3;
        lm[(n + 1) * i + j] = q ? i : lm[(n + 1) * (i - 1) + (j - 1)];
      }
    }
  }
  let bj = n;
  let bi = m;
  const res = [];
  while (bi > 0) {
    const p = pred[(n + 1) * bi + bj];
    if (p === 0) {
      bi--;
    } else if (p === 1) {
      bj--;
    } else {
      bi--;
      bj--;
      if (p === 2) res.push(bi);
    }
  }
  res.reverse();
  const min = cost[(n + 1) * m + n];
  return [min, res] as const;
}

export type SearchResult<T> = {
  score: number;
  match: number[];
} & T;
/**
 * A React wrapper around the minScore function
 * @param data The array that should be searched in
 * @param pattern The pattern that should be searched for
 * @param maxScore The max score that the items in the output should have (score is bad)
 * @param getter A function that turns an item into a string
 */
const useSearch = <T>(
  data: T[],
  pattern: string,
  maxScore: number,
  getter: (t: T) => string,
) => {
  const allResults = useMemo(
    () => data.map(w => ({ score: 0, match: [], ...w })),
    [data],
  );
  const res = useMemo(
    () =>
      pattern.length === 0
        ? allResults
        : data
            .map(w => {
              const [score, match] = minScore(getter(w), pattern);
              return { score, match, ...w };
            })
            .filter(({ score }) => score < maxScore)
            .sort(({ score: aScore }, { score: bScore }) => aScore - bScore),
    [pattern, data, getter, maxScore, allResults],
  );

  return res;
};
export default useSearch;
