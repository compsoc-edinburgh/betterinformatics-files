import {
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  Card,
  CardColumns,
  Col,
  Pagination,
  PaginationItem,
  PaginationLink,
  Row,
} from "@vseth/components";
import { css } from "emotion";
import { escapeRegExp } from "lodash";
import React from "react";
import { Link } from "react-router-dom";
import MarkdownText from "../components/markdown-text";
import { HighlightedMatch, SearchResponse } from "../interfaces";

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

interface Props {
  data: SearchResponse;
}
const SearchResults: React.FC<Props> = React.memo(({ data }) => {
  return (
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
                        <Link to={`/category/${result.category_slug}`}>
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
                  <Row key={page} className="position-relative">
                    <Col xs="auto" className="position-static">
                      <Pagination>
                        <PaginationItem active>
                          <PaginationLink
                            href={`/exams/${result.filename}/#page-${page}`}
                            className="border stretched-link position-static"
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
                          <HighlightedContent content={part} key={i} />
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
            <div className="px-2" key={`answer-${result.long_id}`}>
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
                        <Link to={`/category/${result.category_slug}`}>
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
                <div className="position-relative">
                  <Link
                    className="text-link stretched-link"
                    to={`/exams/${result.filename}/#${result.long_id}`}
                  >
                    <h6>{result.author_displayname}</h6>
                  </Link>
                  <HighlightedMarkdown
                    content={result.text}
                    matches={result.highlighted_words}
                  />
                </div>
              </Card>
            </div>
          );
        } else {
          return (
            <div className="px-2" key={`comment-${result.long_id}`}>
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
                        <Link to={`/category/${result.category_slug}`}>
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
                <div className="position-relative">
                  <Link
                    className="text-link stretched-link"
                    to={`/exams/${result.filename}/#${result.long_id}`}
                  >
                    <h6>{result.author_displayname}</h6>
                  </Link>
                  <HighlightedMarkdown
                    content={result.text}
                    matches={result.highlighted_words}
                  />
                </div>
              </Card>
            </div>
          );
        }
      })}
    </CardColumns>
  );
});
export default SearchResults;
