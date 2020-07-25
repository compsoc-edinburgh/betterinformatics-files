import { useDebounce, useRequest } from "@umijs/hooks";
import {
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  Card,
  CardColumns,
  Col,
  Container,
  FormGroup,
  Pagination,
  PaginationItem,
  PaginationLink,
  Row,
} from "@vseth/components";
import { css } from "emotion";
import React from "react";
import { Link } from "react-router-dom";
import { StringParam, useQueryParam } from "use-query-params";
import { fetchPost } from "../api/fetch-utils";
import LoadingOverlay from "../components/loading-overlay";
import MarkdownText from "../components/markdown-text";
import useTitle from "../hooks/useTitle";
import { escapeRegExp } from "../utils/regex-utils";

const columnStyle = css`
  column-gap: 0;
  grid-column-gap: 0;
  margin: 0 -0.75em;
  padding-top: 1em;
  padding-bottom: 1em;
  column-count: 1;
  @media (min-width: 900px) {
    column-count: 2;
  }
`;

type HighlightedMatch = string | HighlightedMatch[];
type HighlightedMatches = HighlightedMatch[];
type Page = [number, number, HighlightedMatches];
interface ExamSearchResult {
  type: "exam";
  rank: number;

  headline: HighlightedMatches;

  pages: Page[];

  displayname: string;
  filename: string;

  category_displayname: string;
  category_slug: string;
}
interface AnswerSearchResult {
  type: "answer";
  rank: number;

  text: string;
  highlighted_words: string[];
  author_username: string;
  author_displayname: string;
  long_id: string;

  exam_displayname: string;
  filename: string;

  category_displayname: string;
  category_slug: string;
}
interface CommentSearchResult {
  type: "comment";
  rank: number;

  text: string;
  highlighted_words: string[];
  author_username: string;
  author_displayname: string;
  long_id: string;

  exam_displayname: string;
  filename: string;

  category_displayname: string;
  category_slug: string;
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

const noMarginBreadcrumb = css`
  & .breadcrumb {
    margin: 0;
  }
`;
const HighlightedMarkdown: React.FC<{ content: string; matches: string[] }> = ({
  content,
  matches,
}) => {
  const regex = new RegExp(`${matches.map(escapeRegExp).join("|")}`);
  return <MarkdownText value={content} regex={regex} />;
};
const SearchPage: React.FC<{}> = () => {
  useTitle("VIS Community Solutions");
  const [optionalTerm, setTerm] = useQueryParam("q", StringParam);
  const term = optionalTerm || "";
  const debouncedTerm = useDebounce(term, 300);
  const { data, error, loading } = useRequest(
    () => (debouncedTerm ? loadSearch(debouncedTerm) : Promise.resolve([])),
    {
      refreshDeps: [debouncedTerm],
    },
  );
  return (
    <>
      <Container>
        <FormGroup className="m-1">
          <div className="search m-0">
            <input
              type="text"
              className="search-input"
              placeholder="Search"
              value={term}
              onChange={e => setTerm(e.currentTarget.value)}
              autoFocus
            />
            <div className="search-icon-wrapper">
              <div className="search-icon" />
            </div>
          </div>
        </FormGroup>
      </Container>
      <div className="position-relative">
        <LoadingOverlay loading={loading || debouncedTerm !== term} />
        <Container>
          <div>
            {data && data.length === 0 && debouncedTerm !== "" && (
              <div className="text-center p-4">
                <h4>No Result</h4>
                <p>We couldn't find anything matching your search term.</p>
              </div>
            )}
            {data && (
              <CardColumns className={columnStyle}>
                {data.map(result => {
                  if (result.type === "exam") {
                    return (
                      <div className="px-2" key={`exam-${result.filename}`}>
                        <Card className="mb-3 px-3 pb-3 pt-2">
                          <Row>
                            <Col
                              xs="auto"
                              className="d-flex flex-column justify-content-center"
                            >
                              <Badge>Exam</Badge>
                            </Col>
                            <Col xs="auto">
                              <Breadcrumb className={noMarginBreadcrumb}>
                                <BreadcrumbItem>
                                  <Link
                                    to={`/category/${result.category_slug}`}
                                  >
                                    {result.category_displayname}
                                  </Link>
                                </BreadcrumbItem>
                              </Breadcrumb>
                            </Col>
                          </Row>
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
                                  <React.Fragment key={i}>
                                    <span className="text-muted">...</span>
                                    <HighlightedContent
                                      content={part}
                                      key={i}
                                    />
                                    <span className="text-muted">...</span>
                                    {i !== matches.length - 1 && " "}
                                  </React.Fragment>
                                ))}
                              </Col>
                            </Row>
                          ))}
                        </Card>
                      </div>
                    );
                  } else if (result.type === "answer") {
                    return (
                      <div className="px-2" key={`exam-${result.long_id}`}>
                        <Card className="mb-3 px-3 pb-3 pt-2">
                          <Row>
                            <Col
                              xs="auto"
                              className="d-flex flex-column justify-content-center"
                            >
                              <Badge>Answer</Badge>
                            </Col>
                            <Col xs="auto">
                              <Breadcrumb className={noMarginBreadcrumb}>
                                <BreadcrumbItem>
                                  <Link
                                    to={`/category/${result.category_slug}`}
                                  >
                                    {result.category_displayname}
                                  </Link>
                                </BreadcrumbItem>
                                <BreadcrumbItem>
                                  <Link to={`/exam/${result.filename}`}>
                                    {result.exam_displayname}
                                  </Link>
                                </BreadcrumbItem>
                              </Breadcrumb>
                            </Col>
                          </Row>
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
                      </div>
                    );
                  } else {
                    return (
                      <div className="px-2" key={`exam-${result.long_id}`}>
                        <Card className="mb-3 px-3 pb-3 pt-2">
                          <Row>
                            <Col
                              xs="auto"
                              className="d-flex flex-column justify-content-center"
                            >
                              <Badge>Comment</Badge>
                            </Col>
                            <Col xs="auto">
                              <Breadcrumb className={noMarginBreadcrumb}>
                                <BreadcrumbItem>
                                  <Link
                                    to={`/category/${result.category_slug}`}
                                  >
                                    {result.category_displayname}
                                  </Link>
                                </BreadcrumbItem>
                                <BreadcrumbItem>
                                  <Link to={`/exam/${result.filename}`}>
                                    {result.exam_displayname}
                                  </Link>
                                </BreadcrumbItem>
                              </Breadcrumb>
                            </Col>
                          </Row>
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
                      </div>
                    );
                  }
                })}
              </CardColumns>
            )}
            {error && (
              <div>
                Error: <pre>{JSON.stringify(error, null, 3)}</pre>
              </div>
            )}
          </div>
        </Container>
      </div>
    </>
  );
};
export default SearchPage;
