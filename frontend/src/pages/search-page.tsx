import { useDebounce, useRequest } from "@umijs/hooks";
import {
  Card,
  Col,
  Container,
  FormGroup,
  Pagination,
  PaginationItem,
  PaginationLink,
  Row,
} from "@vseth/components";
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPost } from "../api/fetch-utils";
import LoadingOverlay from "../components/loading-overlay";
import MarkdownText from "../components/markdown-text";
import useTitle from "../hooks/useTitle";

type HighlightedMatch = string | HighlightedMatch[];
type HighlightedMatches = HighlightedMatch[];
type Page = [number, number, HighlightedMatches];
interface ExamSearchResult {
  type: "exam";
  rank: number;
  filename: string;
  headline: HighlightedMatches;
  displayname: string;
  pages: Page[];
}
interface AnswerSearchResult {
  type: "answer";
  rank: number;
  text: string;
  highlighted_words: string[];
  author_username: string;
  author_displayname: string;
  filename: string;
  long_id: string;
}
interface CommentSearchResult {
  type: "comment";
  rank: number;
  text: string;
  highlighted_words: string[];
  author_username: string;
  author_displayname: string;
  filename: string;
  long_id: string;
}
type SearchResult = ExamSearchResult | AnswerSearchResult | CommentSearchResult;
type SearchResponse = SearchResult[];

const loadSearch = async (term: string) => {
  return (await fetchPost("/api/exam/search/", { term }))
    .value as SearchResponse;
};
const HighlightedContent: React.FC<{
  content: HighlightedMatch;
  level?: number;
}> = ({ content, level = 0 }) => {
  if (typeof content === "string") {
    if (level > 1) {
      return <mark>{content}</mark>;
    }
    return <span>{content}</span>;
  } else {
    return (
      <>
        {content.map((child, i) => (
          <HighlightedContent key={i} content={child} level={level + 1} />
        ))}
      </>
    );
  }
};
function escapeRegExp(str: string) {
  return str.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}
function highlightWordsInTextNode(
  revert: (() => void)[],
  element: Text,
  regex: RegExp,
) {
  const text = element.nodeValue || "";
  const m = regex.test(text);
  if (!m) return;
  const el = document.createElement("span");
  let i = 0;
  while (i < text.length) {
    const rest = text.substring(i);
    const m = rest.match(regex);
    if (m) {
      const start = m.index || 0;
      const t = document.createTextNode(rest.substring(0, start));
      el.appendChild(t);

      const mark = document.createElement("mark");
      mark.innerText = m[0];
      el.appendChild(mark);

      i += start + m[0].length;
    } else {
      const t = document.createTextNode(rest);
      el.appendChild(t);
      break;
    }
  }
  const parentNode = element.parentNode!;
  revert.push(() => {
    parentNode.replaceChild(element, el);
  });
  parentNode.replaceChild(el, element);
}
function highlightWords(
  revert: (() => void)[],
  element: HTMLElement,
  regex: RegExp,
) {
  const children = element.childNodes;
  for (let i = 0; i < children.length; i++) {
    const c = children[i];
    if (c.nodeType === Node.TEXT_NODE) {
      highlightWordsInTextNode(revert, c as Text, regex);
    } else if (c instanceof HTMLElement) {
      highlightWords(revert, c, regex);
    }
  }
}
const HighlightedMarkdown: React.FC<{ content: string; matches: string[] }> = ({
  content,
  matches,
}) => {
  const regex = new RegExp(`${matches.map(escapeRegExp).join("|")}`);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const revert: (() => void)[] = [];
    highlightWords(revert, el, regex);
    return () => {
      for (const op of revert) {
        op();
      }
    };
  }, [regex, ref]);
  return (
    <div ref={ref}>
      <MarkdownText value={content} />
    </div>
  );
};
const SearchPage: React.FC<{}> = () => {
  useTitle("VIS Community Solutions");
  const [term, setTerm] = useState("");
  const debouncedTerm = useDebounce(term, 600);
  const { data, error, loading } = useRequest(
    () => (debouncedTerm ? loadSearch(debouncedTerm) : Promise.resolve([])),
    {
      refreshDeps: [debouncedTerm],
    },
  );
  return (
    <Container>
      <FormGroup className="m-1">
        <div className="search m-0">
          <input
            type="text"
            className="search-input"
            placeholder="Filter..."
            value={term}
            onChange={e => setTerm(e.currentTarget.value)}
            autoFocus
          />
          <div className="search-icon-wrapper">
            <div className="search-icon" />
          </div>
        </div>
      </FormGroup>
      <div className="position-relative">
        <LoadingOverlay loading={loading || debouncedTerm !== term} />
        {data && (
          <div>
            {data.map(result => {
              if (result.type === "exam") {
                return (
                  <Card body key={`exam-${result.filename}`} className="my-2">
                    <h6>
                      {result.headline.map((part, i) => (
                        <HighlightedContent content={part} key={i} />
                      ))}
                    </h6>
                    {result.pages.map(([page, _, matches]) => (
                      <Row>
                        <Col xs="auto">
                          <Pagination>
                            <PaginationItem active>
                              <PaginationLink
                                href={`/exams/${result.filename}/#page-${page}`}
                                className="border"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          </Pagination>
                        </Col>
                        <Col>
                          {matches.map((part, i) => (
                            <>
                              <span className="text-muted">...</span>
                              <HighlightedContent content={part} key={i} />
                              <span className="text-muted">...</span>
                              {i !== matches.length - 1 && " "}
                            </>
                          ))}
                        </Col>
                      </Row>
                    ))}
                  </Card>
                );
              } else if (result.type === "answer") {
                return (
                  <Card body key={`exam-${result.long_id}`} className="my-2">
                    <Link
                      className="text-link"
                      to={`/exams/${result.filename}/#${result.long_id}`}
                    >
                      <h6>{result.author_displayname}</h6>
                    </Link>
                    <HighlightedMarkdown
                      content={result.text}
                      matches={result.highlighted_words}
                    />
                  </Card>
                );
              } else {
                return (
                  <Card body key={`exam-${result.long_id}`} className="my-2">
                    <Link
                      className="text-link"
                      to={`/exams/${result.filename}/#${result.long_id}`}
                    >
                      <h6>{result.author_displayname}</h6>
                    </Link>
                    <HighlightedMarkdown
                      content={result.text}
                      matches={result.highlighted_words}
                    />
                  </Card>
                );
              }
            })}
          </div>
        )}
        {error && (
          <div>
            Error: <pre>{JSON.stringify(error, null, 3)}</pre>
          </div>
        )}
      </div>
    </Container>
  );
};
export default SearchPage;
