import Fuse from "fuse.js";

export const getMatch = <T>(result: Fuse.FuseResult<T>, key: string) => {
  return result.matches?.find(e => e.key === key)?.indices;
};

export const processMatch = (
  m: readonly Fuse.RangeTuple[] | undefined,
  value: string,
): Array<[string, boolean]> => {
  if (m === undefined) return [[value, false]];
  const res: Array<[string, boolean]> = [];
  let last = 0;
  for (const [start, end] of m) {
    if (start > last) res.push([value.substring(last, start), false]);
    res.push([value.substring(start, end + 1), true]);
    last = end + 1;
  }
  if (value.length > last)
    res.push([value.substring(last, value.length), false]);
  return res;
};
