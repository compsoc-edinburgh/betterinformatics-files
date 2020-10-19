import Fuse from "fuse.js";
import { useMemo } from "react";

/**
 * A React wrapper around the fuse.js search method that returns all data source elements
 * if pattern is undefined.
 * @param data The array that should be used as the fuse.js data source
 * @param options An object of fuse.js options
 * @param pattern The pattern that should be searched for
 * @param searchOptions Options passed to the fuse.js search method
 */
const useSearch = <T>(
  data: T[],

  options?: Fuse.IFuseOptions<T>,
  pattern?: string | Fuse.Expression,
  searchOptions?: Fuse.FuseSearchOptions,
) => {
  const fuse = useMemo(() => new Fuse(data, options), [data, options]);
  const allMatch = useMemo(() => {
    return data.map((item, refIndex) => ({
      item,
      refIndex,
      score: 0,
      matches: [],
    }));
  }, [data]);
  const res = useMemo(
    () =>
      pattern === undefined ? allMatch : fuse.search(pattern, searchOptions),
    [fuse, pattern, searchOptions, allMatch],
  );

  return res;
};
export default useSearch;
