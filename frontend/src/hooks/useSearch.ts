import { useMemo } from "react";

/**
 * Computes a cost that estimates autocompletion relevance
 * The resulting cost will be between 0-255
 * 0 is perfect - "Advanced Algorithms", "Advanced" will have a cost of 0
 * 10 is already fairly bad
 *
 * 2d arrays `cost[i][j] = cost[(bSize + 1) * i + j]`
 * `cost[i][j]` is the minimal editing cost between `a.substr(0, i)` and `b.substr(0, j)`
 *
 * Pred array for extracting the match array:
 * ```
 * 0 = removed char in a
 * 1 = removed char in b
 * 2 = matching char
 * 3 = replaced char
 * ```
 *
 * last matching location for the min cost solution that enabled the
 * cost in `cost[i][j]`
 *
 * @param cost The cost array that should be used
 * @param pred The pred array that should be used
 * @param lm The lastMatch array that should be used
 * @param a The string that is not the search term
 * @param b The search term
 * @param arrayStride The stride that should be used for cost, pred, lm
 * @param bStart The index where dp computation should be started, pass 0 if cost, pred, lm are empty
 */
function minCost(
  cost: Uint8ClampedArray,
  pred: Uint8ClampedArray,
  lm: Uint8ClampedArray,
  a: string,
  b: string,
  arrayStride: number,
  bStart: number,
) {
  // Convert to lowercase to facilitate case insensitive searching
  const ac = a.toLowerCase();
  const bc = b.toLowerCase();
  const m = a.length;
  const n = b.length;

  // Initialize dp array: the algorithm is ok with starting at an arbitrary location in `a`...
  for (let i = 1; i <= m; i++) {
    cost[arrayStride * i] = 9;
  }
  // ...but it doesn't like starting with an arbitrary position in `b`
  // 255 is the worst score - it will always be cheaper to remove these chars in the main
  // DP part
  for (let j = bStart + 1; j <= n; j++) {
    cost[j] = 255;
  }
  for (let i = 1; i <= m; i++) {
    const prevRowIndex = arrayStride * (i - 1);
    const rowIndex = arrayStride * i;
    for (let j = bStart + 1; j <= n; j++) {
      // Replacement cost / benefit:
      // We don't want the algorithm to replace chars
      let sCost = 10;
      //
      const matched = ac[i - 1] === bc[j - 1];
      // Matching chars are nice
      // but as we are ignoring jumps in a we want these to cost as well:
      // Advanced Algorithms, avcdag is bad
      // Advanced Algorithms, dvancedgorithm is better
      // Advanced Algorithms, AdvAlgo is really good
      // Advanced Algorithms, Advanced Algorithms is equally good
      // These fuzzy searching metrics were made for autocompletion and as such partial results will
      // be quite common
      if (matched) {
        sCost = 3;
      }
      // Matches where the last char was also a match are really good
      const t = lm[prevRowIndex + (j - 1)];
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
      const sa = cost[prevRowIndex + j];
      // Ignoring a char in our search term isn't what we want, but if the search term is long we might be
      // ok with it
      const sb = cost[rowIndex + (j - 1)] + Math.max(9 - bc.length, 5);
      // Determined by the rules seen above
      const sc = cost[prevRowIndex + (j - 1)] + sCost;
      cost[rowIndex + j] = Math.min(sa, sb, sc);

      if (sa < sb && sa < sc) {
        // Ignore a is the best option
        pred[rowIndex + j] = 0;
        lm[rowIndex + j] = lm[prevRowIndex + j];
      } else if (sb < sc) {
        // Ignore b is the best option
        pred[rowIndex + j] = 1;
        lm[rowIndex + j] = lm[rowIndex + (j - 1)];
      } else {
        // Match / Replace is the best option
        pred[rowIndex + j] = matched ? 2 : 3;
        // Update last match dp array if the char matched
        lm[rowIndex + j] = matched ? i : lm[prevRowIndex + (j - 1)];
      }
    }
  }

  // Extract the solution:
  // Start at the bottom right
  let bj = n;
  let bi = m;
  const res: number[] = [];
  while (bi > 0) {
    // What kind of action was applied here
    const p = pred[arrayStride * bi + bj];
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
  const min = cost[arrayStride * m + n];
  return [min, res] as const;
}

export interface SearchCacheEntry {
  b: string;
  stride: number;
  cost: Uint8ClampedArray;
  pred: Uint8ClampedArray;
  lm: Uint8ClampedArray;
}
export type SearchCache = Map<string, SearchCacheEntry>;

/**
 * Determines the number of matching characters at the beginning of the two strings
 *
 * Examples:
 * ```ts
 * "test", "tes" => 3
 * "cat", "bat" => 0
 * "dog", "dog" => 3
 * "", "" => 0
 * ```
 * @param a A string
 * @param b Another string
 */
function prefixLength(a: string, b: string) {
  const maxIndex = Math.min(a.length, b.length);
  let i = 0;
  while (i < maxIndex && a[i] === b[i]) i++;

  return i;
}

/**
 * How much memory should be reserved for append operations?
 */
const CACHE_APPEND_SPACE = 3;

/**
 * Uses the provided cache to avoid allocating dp tables and speed up the computation by not
 * computing parts of the dp table again. This results in linear time performance for removal / insertion
 * at the end of string `b`. Such search terms are heavily favored: If the previous search was `"Diskrete"`
 * the next search with `"DiskreteM"` will only take `O(n)` time.
 *
 * Initial allocation & search terms will always take `O(nm)` time.
 *
 * In general a search term which isn't `CACHE_APPEND_SPACE` characters longer than some previous search
 * will take `O(n + (m - prefixLength(a, b)) * n)`
 *
 * The memory usage will be in `O(n + longestSearchTerm)` - use a new cache if the old is useless.
 * @param cache The cache that should be used, it will also be filled with the potentially new entry
 * @param a The string that is not the search term
 * @param b The search term
 */
export function cachedMinCost(cache: SearchCache, a: string, b: string) {
  // Let's see if we encountered that string before
  const cacheEntry = cache.get(a);

  // We need `b.length + 1` because the minCost uses the first row to optimize its
  // base cases
  if (cacheEntry !== undefined && cacheEntry.stride >= b.length + 1) {
    const arrayStride = cacheEntry.stride;
    const cost = cacheEntry.cost;
    const pred = cacheEntry.pred;
    const lm = cacheEntry.lm;
    const start = prefixLength(b, cacheEntry.b);

    cache.set(a, { b, stride: arrayStride, cost, pred, lm });
    return minCost(cost, pred, lm, a, b, arrayStride, start);
  }

  const m = a.length;

  const arrayStride = m + CACHE_APPEND_SPACE + 1;
  const cost = new Uint8ClampedArray((m + 1) * arrayStride);
  const pred = new Uint8ClampedArray((m + 1) * arrayStride);
  const lm = new Uint8ClampedArray((m + 1) * arrayStride);

  cache.set(a, { b, stride: arrayStride, cost, pred, lm });
  return minCost(cost, pred, lm, a, b, arrayStride, 0);
}

/**
 * represents a search result
 */
export type SearchResult<T> = {
  /**
   * A positive integer from 0-255, 0 is a perfect match, 255 is a really bad match
   */
  score: number;
  /**
   * The indices which matched
   */
  match: number[];
} & T;

/**
 * A React wrapper around the minCost function
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
  const cache = useMemo(() => new Map() as SearchCache, []);
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
              const [score, match] = cachedMinCost(cache, getter(w), pattern);
              return { score, match, ...w };
            })
            .filter(({ score }) => score < maxScore)
            .sort(({ score: aScore }, { score: bScore }) => aScore - bScore),
    [pattern, data, getter, maxScore, allResults, cache],
  );

  return res;
};
export default useSearch;
