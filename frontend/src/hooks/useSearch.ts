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
 * @param lm The `lastMatch` array that should be used
 * @param a The string that is not the search term
 * @param b The search term
 * @param bStart The index where dp computation should be started, pass `0` if `cost`, `pred`, `lm` are empty
 * @param maxCost The max cost that the items in the output should have (cost is bad)
 * @returns The cost and the match array, `undefined` if the cost is too high
 */
function minCost(
  cost: Uint8ClampedArray,
  pred: Uint8ClampedArray,
  lm: Uint8ClampedArray,
  a: string,
  b: string,
  bStart: number,
  maxCost: number,
) {
  const m = a.length;
  const n = b.length;

  const arrayStride = m + 1;

  cost[0] = 0;

  // Initialize dp array: the algorithm is ok with starting at an arbitrary location in `a`...
  for (let i = 1; i <= m; i++) {
    cost[i] = 2;
  }
  // ...but it doesn't like starting with an arbitrary position in `b`
  // 255 is the worst cost - it will always be cheaper to remove these chars in the main
  // DP part
  for (let j = 1; j <= n; j++) {
    cost[arrayStride * j] = 255;
  }

  for (let j = bStart + 1; j <= n; j++) {
    const prevRowIndex = arrayStride * (j - 1);
    const rowIndex = arrayStride * j;
    for (let i = 1; i <= m; i++) {
      // Replacement cost / benefit:
      // We don't want the algorithm to replace chars
      let replaceCost = 5;

      const matched = a[i - 1] === b[j - 1];
      // Matching chars are nice
      // but as we are ignoring jumps in a we want these to cost as well:
      // Advanced Algorithms, avcdag is bad
      // Advanced Algorithms, dvancedgorithm is better
      // Advanced Algorithms, AdvAlgo is really good
      // Advanced Algorithms, Advanced Algorithms is equally good
      // These fuzzy searching metrics were made for autocompletion and as such partial results will
      // be quite common
      if (matched) {
        replaceCost = 3;
      }
      // Matches where the last char was also a match are really good
      const t = lm[prevRowIndex + (i - 1)];
      if (matched && t === i - 1) {
        replaceCost = 0;
      }
      // Matches at the beginning or after a space are what we want
      if (matched && (i === 1 || a[i - 2] === " ")) {
        replaceCost = 0;
      }

      // Our DP recursion has three possibilities: ignore a char in a, ignore a char in b and replace /
      // match

      // Ignore char in a isn't costly, but also isn't free because `replaceCost` won't result in a "free" match
      const sa = cost[rowIndex + (i - 1)];
      // Ignoring a char in our search term isn't what we want, but if the search term is long we might be
      // ok with it
      const sb = cost[prevRowIndex + i] + 6;
      // Determined by the rules seen above
      const sc = cost[prevRowIndex + (i - 1)] + replaceCost;
      cost[rowIndex + i] = Math.min(sa, sb, sc);

      if (sa < sb && sa < sc) {
        // Ignore a is the best option
        pred[rowIndex + i] = 0;
        lm[rowIndex + i] = lm[rowIndex + (i - 1)];
      } else if (sb < sc) {
        // Ignore b is the best option
        pred[rowIndex + i] = 1;
        lm[rowIndex + i] = lm[prevRowIndex + i];
      } else {
        // Match / Replace is the best option
        pred[rowIndex + i] = matched ? 2 : 3;
        // Update last match dp array if the char matched
        lm[rowIndex + i] = matched ? i : lm[prevRowIndex + (i - 1)];
      }
    }
  }
  // Our cost can be found in the bottom right corner
  const min = cost[arrayStride * n + m];

  // If the cost is too high, we might as well return early, because
  // the match array won't be used
  if (min >= maxCost) return undefined;

  // Extract the solution:
  // Start at the bottom right
  let bj = n;
  let bi = m;
  const res: number[] = [];
  while (bi > 0) {
    // What kind of action was applied here
    const p = pred[arrayStride * bj + bi];
    if (p === 0) {
      bi--;
    } else if (p === 1) {
      bj--;
    } else {
      bi--;
      bj--;
      if (p === 2) res.push(bi);
      // We found a match
    }
  }
  // The matches were inserted in the wrong order
  res.reverse();

  return [min, res] as const;
}

export interface SearchCacheEntry {
  b: string;
  rows: number;
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
const CACHE_APPEND_SPACE = 6;

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
export function cachedMinCost(
  cache: SearchCache,
  a: string,
  b: string,
  maxScore: number,
) {
  // Let's see if we encountered that string before
  const cacheEntry = cache.get(a);

  // We need `b.length + 1` because the `minCost` uses the first row to optimize its
  // base cases
  if (cacheEntry !== undefined && cacheEntry.rows >= b.length + 1) {
    const rows = cacheEntry.rows;
    const cost = cacheEntry.cost;
    const pred = cacheEntry.pred;
    const lm = cacheEntry.lm;
    const start = prefixLength(b, cacheEntry.b);

    cache.set(a, { b, rows, cost, pred, lm });
    return minCost(cost, pred, lm, a, b, start, maxScore);
  }

  const m = a.length;

  const rows = b.length + CACHE_APPEND_SPACE + 1;
  const cost = new Uint8ClampedArray((m + 1) * rows);
  const pred = new Uint8ClampedArray((m + 1) * rows);
  const lm = new Uint8ClampedArray((m + 1) * rows);

  cache.set(a, { b, rows, cost, pred, lm });
  return minCost(cost, pred, lm, a, b, 0, maxScore);
}

/**
 * represents a search term
 */
export type SearchResult<T> = {
  /**
   * A positive integer from `0-255`, `0` is a perfect match, `255` is a really bad match
   */
  cost: number;
  /**
   * The indices which matched, sorted in ascending order
   */
  match: number[];
} & T;

/**
 * Helper function to use in filters
 * @param value The value which is potentially `undefined`
 * @returns Whether the value is `undefined`
 */
function notUndefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

/**
 * A React wrapper around the minCost function
 * @param data The array that should be searched in
 * @param pattern The pattern that should be searched for
 * @param maxCost The max cost that the items in the output should have (cost is bad)
 * @param getter A function that turns an item into a string
 */
const useSearch = <T>(
  data: T[],
  pattern: string,
  maxCost: number,
  getter: (t: T) => string,
): SearchResult<T>[] => {
  // We remove spacing from the beginning and also reduce multiple consecutive whitespace
  // to a single space character, converting all types of whitespace to `" "` in the process.
  const sanitizedPattern = pattern
    .trimStart()
    .replace(/\s+/g, " ")
    .toLowerCase();

  const cache = useMemo(() => new Map() as SearchCache, []);
  const allResults = useMemo(
    () => data.map(w => ({ cost: 0, match: [], ...w })),
    [data],
  );
  const res = useMemo(
    () =>
      sanitizedPattern.length === 0
        ? allResults
        : data
            .map(w => {
              const value = getter(w);
              const res = cachedMinCost(
                cache,
                value.toLowerCase(),
                sanitizedPattern,
                maxCost,
              );
              if (res === undefined) return undefined;
              const [cost, match] = res;
              return { cost, match, value, ...w };
            })
            // Filter out `undefined` results - it is guaranteed, that `cachedMinCost` will return
            // `undefined` if the cost would be higher than the `maxCost`, thus we don't have to
            // care about `maxCost` here
            .filter(notUndefined)
            // Sort remaining results, using a mutating `.sort` is okay here because
            // we are only modifying an intermediate array created by the `.map()` call
            .sort(
              (
                { cost: aCost, value: aValue },
                { cost: bCost, value: bValue },
              ) => {
                // We want to sort by cost, but if the costs are equal, we want to sort by the
                // length of the value, so that shorter values are always sorted first.

                // Primary sort is by cost, a lower cost is better
                const costDiff = aCost - bCost;
                if (costDiff !== 0) return costDiff;

                // Secondary sort is by length, a shorter value is better
                const lengthDiff = aValue.length - bValue.length;
                if (lengthDiff !== 0) return lengthDiff;

                // If the costs are equal and are of the same length, we use `localeCompare` to
                // resolve ties
                return aValue.localeCompare(bValue);
              },
            ),
    [sanitizedPattern, data, getter, maxCost, allResults, cache],
  );

  return res;
};
export default useSearch;
