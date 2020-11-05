import { useMemo } from "react";

function minScore(a: string, b: string) {
  const ac = a.toLowerCase();
  const bc = b.toLowerCase();
  const m = a.length;
  const n = b.length;

  // 2d arrays cost[i][j] = cost[(n + 1) * i + j]
  // cost[i][j] is the minimal editing cost between a.substr(0, i) and b.substr(0, j)
  const cost = new Uint8ClampedArray((m + 1) * (n + 1));
  // Pred array for extracting the match array:
  // 0 = removed char in a
  // 1 = removed char in b
  // 2 = matching char
  // 3 = replaced char
  const pred = new Uint8ClampedArray((m + 1) * (n + 1));
  // last matching location for the min cost solution that enabled the
  // cost in cost[i][j]
  const lm = new Uint8ClampedArray((m + 1) * (n + 1));
  // Initialize dp array: the algorithm is ok with starting at an arbitrary location in `a`...
  for (let i = 1; i <= m; i++) {
    cost[(n + 1) * i] = 9;
  }
  // ...but it doesn't like starting with an arbitrary position in `b`
  // 255 is the worst score - it will always be cheaper to remove these chars in the main
  // DP part
  for (let j = 1; j <= n; j++) {
    cost[j] = 255;
  }
  for (let j = 1; j <= n; j++) {
    for (let i = 1; i <= m; i++) {
      // Replacement cost / benefit:
      // We don't want the algorithm to replace chars
      let sCost = 10;
      //
      const matched = ac[i - 1] === bc[j - 1];
      // Matching chars are nice
      if (matched) {
        sCost = 3;
      }
      // Matches where the last char was also a match are really good
      const t = lm[(n + 1) * (i - 1) + (j - 1)];
      if (matched && t === i - 1) {
        sCost = -1;
      }
      // Matches at the beginning or after a space are what we want
      if (matched && (i === 1 || ac[i - 2] === " ")) {
        sCost = -2;
      }

      // Our DP recursion has three possibilities ignore a char in a, ignore a char in b and replace /
      // match

      // Ignore char in a isn't costly, but also isn't free because sCost won't result in a "free" match
      const sa = cost[(n + 1) * (i - 1) + j];
      // Ignoring a char in our search term isn't what we want, but if the search term is long we might be
      // ok with it
      const sb = cost[(n + 1) * i + (j - 1)] + Math.max(9 - bc.length, 5);
      // Determined by the rules seen above
      const sc = cost[(n + 1) * (i - 1) + (j - 1)] + sCost;
      cost[(n + 1) * i + j] = Math.min(sa, sb, sc);

      if (sa < sb && sa < sc) {
        // Ignore a is the best option
        pred[(n + 1) * i + j] = 0;
        lm[(n + 1) * i + j] = lm[(n + 1) * (i - 1) + j];
      } else if (sb < sc) {
        // Ignore b is the best option
        pred[(n + 1) * i + j] = 1;
        lm[(n + 1) * i + j] = lm[(n + 1) * i + (j - 1)];
      } else {
        // Match / Replace is the best option
        pred[(n + 1) * i + j] = matched ? 2 : 3;
        // Update last match dp array if the char matched
        lm[(n + 1) * i + j] = matched ? i : lm[(n + 1) * (i - 1) + (j - 1)];
      }
    }
  }

  // Extract the solution:
  // Start at the bottom right
  let bj = n;
  let bi = m;
  const res = [];
  while (bi > 0) {
    // What kind of action was applied here
    const p = pred[(n + 1) * bi + bj];
    if (p === 0) {
      bi--;
    } else if (p === 1) {
      bj--;
    } else {
      bi--;
      bj--;
      // We found a match
      if (p === 2) res.push(bi);
    }
  }
  // The matches were inserted in the wrong order
  res.reverse();

  // Our score can be found in the bottom right corner
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
