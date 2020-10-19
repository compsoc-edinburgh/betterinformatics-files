import Fuse from "fuse.js";
import { useMemo } from "react";

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
