import { Divider, Stack, Text } from "@mantine/core";
import { SearchResult as LocalSearchResult } from "../../../hooks/useSearch";
import {
  AnswerSearchResult,
  CategoryMetaDataMinimal,
  CommentSearchResult,
  ExamSearchResult,
  SearchResult,
} from "../../../interfaces";
import { QuickSearchResult } from "./QuickSearchResult";
import { highlight } from "../../../utils/search-utils";
import { HighlightedContent } from "../../HighlightSearchHeadline";
import MarkdownText from "../../markdown-text";
import { escapeRegExp } from "lodash-es";
import { useMemo } from "react";

type QuickSeachResultsProps = {
  currentSelection: {
    type:
      | "categories"
      | "examNames"
      | "examPages"
      | "answers"
      | "comments"
      | "more"
      | undefined;
    index: number;
  };
} & (
  | {
      type: "categories";
      results: LocalSearchResult<CategoryMetaDataMinimal>[];
    }
  | {
      type: "examNames";
      results: ExamSearchResult[];
    }
  | {
      type: "examPages";
      results: ExamSearchResult[];
    }
  | {
      type: "answers";
      results: AnswerSearchResult[];
    }
  | {
      type: "comments";
      results: CommentSearchResult[];
    }
  | {
      type: "more";
      results: { searchQuery: string }[];
    }
);

/**
 * Determine the path for a search result item so we can navigate to it.
 *
 * @param item A valid search result item from the API, or a locally found category search result.
 * @returns The path to provide to history.push()
 */
const itemToPath = (
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

/**
 * QuickSearchResults is used to show the results for a single type of quick
 * search result. The component tries to memoize its renders so that changing
 * the `currentSelection` prop doesn't incur expensive re-renders of the child.
 */
export const QuickSearchResults = ({
  type,
  results,
  currentSelection,
}: QuickSeachResultsProps) => {
  // Memoize the expensive rendering of result content so we don't try to
  // re-render the content if only the current selection index changes
  const contents = useMemo(() => {
    if (type === "categories")
      return results.map((category, i) => ({
        element: <Text>{highlight(category.displayname, category.match)}</Text>,
        key: category.slug,
        link: itemToPath(category),
      }));

    if (type === "examNames")
      return results.map((exam, i) => ({
        element: (
          <Text key={i}>
            {exam.headline.map((part, i) => (
              <HighlightedContent content={part} key={i} />
            ))}
          </Text>
        ),
        key: exam.filename,
        link: itemToPath(exam),
      }));

    if (type === "examPages")
      return results.map((exam, i) => ({
        element: (
          <Stack gap={0} key={i}>
            <Text>
              {exam.headline.map((part, i) => (
                <HighlightedContent content={part} key={i} />
              ))}{" "}
              - Page {exam.pages[0][0]}
            </Text>
            <Text opacity={0.7}>
              ...
              {exam.pages[0][2].map((part, i) => (
                <HighlightedContent content={part} key={i} />
              ))}
              ...
            </Text>
          </Stack>
        ),
        key: `${exam.filename}-page-${exam.pages[0][0]}`,
        link: itemToPath(exam),
      }));

    if (type === "answers")
      return results.map((answer, i) => ({
        element: (
          <Stack gap={0} key={i}>
            <Text>
              {answer.author_displayname} on {answer.exam_displayname} -{" "}
              {answer.category_displayname}
            </Text>
            <Text opacity={0.7}>
              <MarkdownText
                value={answer.text}
                regex={
                  new RegExp(
                    `${answer.highlighted_words.map(escapeRegExp).join("|")}`,
                  )
                }
              />
            </Text>
          </Stack>
        ),
        key: answer.long_id,
        link: itemToPath(answer),
      }));

    if (type === "comments")
      return results.map((comment, i) => ({
        element: (
          <Stack gap={0} key={i}>
            <Text>
              {comment.author_displayname} on {comment.exam_displayname} -{" "}
              {comment.category_displayname}
            </Text>
            <Text opacity={0.7}>
              <MarkdownText
                value={comment.text}
                regex={
                  new RegExp(
                    `${comment.highlighted_words.map(escapeRegExp).join("|")}`,
                  )
                }
              />
            </Text>
          </Stack>
        ),
        key: comment.long_id,
        link: itemToPath(comment),
      }));

    return [];
  }, [type, results]);

  return useMemo(() => {
    if (type === "categories" && results.length > 0)
      return (
        <>
          <Divider variant="dashed" label="Categories" labelPosition="left" />
          {contents.map(({ element, key, link }, i) => {
            const isSelected =
              currentSelection.type === "categories" &&
              currentSelection.index === i;
            return (
              <QuickSearchResult
                badge="Category"
                isSelected={isSelected}
                key={key}
                link={link}
                onClick={close}
              >
                {element}
              </QuickSearchResult>
            );
          })}
        </>
      );

    if (type === "examNames" && results.length > 0)
      return (
        <>
          <Divider variant="dashed" label="Exams" labelPosition="left" />
          {contents.map(({ element, key, link }, i) => {
            const isSelected =
              currentSelection.type === "examNames" &&
              currentSelection.index === i;
            return (
              <QuickSearchResult
                badge="Exam"
                isSelected={isSelected}
                key={key}
                link={link}
                onClick={close}
              >
                {element}
              </QuickSearchResult>
            );
          })}
        </>
      );

    if (type === "examPages" && results.length > 0)
      return (
        <>
          <Divider variant="dashed" label="Exam Pages" labelPosition="left" />
          {contents.map(({ element, key, link }, i) => {
            const isSelected =
              currentSelection.type === "examPages" &&
              currentSelection.index === i;
            return (
              <QuickSearchResult
                badge="Exam Page"
                isSelected={isSelected}
                key={key}
                link={link}
                onClick={close}
              >
                {element}
              </QuickSearchResult>
            );
          })}
        </>
      );

    if (type === "answers" && results.length > 0)
      return (
        <>
          <Divider variant="dashed" label="Answers" labelPosition="left" />
          {contents.map(({ element, key, link }, i) => {
            const isSelected =
              currentSelection.type === "answers" &&
              currentSelection.index === i;
            return (
              <QuickSearchResult
                badge="Answer"
                isSelected={isSelected}
                key={key}
                link={link}
                onClick={close}
              >
                {element}
              </QuickSearchResult>
            );
          })}
        </>
      );

    if (type === "comments" && results.length > 0)
      return (
        <>
          <Divider variant="dashed" label="Comments" labelPosition="left" />
          {contents.map(({ element, key, link }, i) => {
            const isSelected =
              currentSelection.type === "comments" &&
              currentSelection.index === i;
            return (
              <QuickSearchResult
                badge="Comment"
                isSelected={isSelected}
                key={key}
                link={link}
                onClick={close}
              >
                {element}
              </QuickSearchResult>
            );
          })}
        </>
      );

    return <></>;
  }, [results.length, type, contents, currentSelection]);
};
