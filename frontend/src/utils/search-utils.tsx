import { CategoryMetaDataMinimal, SearchResult } from "../interfaces";
import { SearchResult as LocalSearchResult } from "../hooks/useSearch";

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

/**
 * Determine the path for a search result item so we can navigate to it.
 *
 * @param item A valid search result item from the API, or a locally found category search result.
 * @returns The path to provide to history.push()
 */
export const itemToPath = (
  item:
    | LocalSearchResult<CategoryMetaDataMinimal>
    | SearchResult
    | { searchQuery: string },
) => {
  if ("slug" in item) {
    return `/category/${item.slug}`;
  } else if ("searchQuery" in item) {
    return `/search?q=${item.searchQuery}`;
  } else if (item.type === "exam" && item.pages.length > 0) {
    return `/exams/${item.filename}/#page-${item.pages[0][0]}`;
  } else if (item.type === "exam") {
    return `/exams/${item.filename}`;
  } else if (item.type === "answer") {
    return `/exams/${item.filename}?answer=${item.long_id}`;
  } else {
    return `/exams/${item.filename}?comment=${item.long_id}&answer=${item.answer_long_id}`;
  }
};
