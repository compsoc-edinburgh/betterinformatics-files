import Fuse from "fuse.js";

/**
 * Returns The RangeTuple with the specified key if it was found in `result`
 * @param result The fuse.js search result
 * @param key The key that should be found
 */
export const getMatch = <T>(result: Fuse.FuseResult<T>, key: string) => {
  return result.matches?.find(e => e.key === key)?.indices;
};

/**
 * Transforms a RangeTuple[] into an array of [string, boolean] where the string
 * is a substring of value, the boolean specifies whether that substring is part of
 * the match and the strings in the array partition the string `value`.
 * @param m the  fuse.js match array that should be processed
 * @param value the value that `m` matched against
 */
export const processMatch = (
  m: readonly Fuse.RangeTuple[] | undefined,
  value: string,
): Array<[string, boolean]> => {
  if (m === undefined) return [[value, false]];
  const s = new Set<number>();
  for (const [start, end] of m) {
    for (let i = start; i <= end; i++) {
      s.add(i);
    }
  }
  const res: Array<[string, boolean]> = [];
  let index = 0;
  while (index < value.length) {
    const matches = s.has(index);
    let substr = value[index];
    index++;
    while (s.has(index) === matches && index < value.length) {
      substr += value[index];
      index++;
    }
    res.push([substr, matches]);
  }
  return res;
};
