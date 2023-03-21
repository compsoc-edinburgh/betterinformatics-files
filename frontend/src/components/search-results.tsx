import { Badge, Box, Breadcrumbs, Card, Group } from "@mantine/core";
import { css } from "@emotion/css";
import { escapeRegExp } from "lodash-es";
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
    <div className={columnStyle}>
      {data.map(result => {
        if (result.type === "exam") {
          return (
            <div className="px-2" key={`exam-${result.filename}`}>
              <Card withBorder className="mb-3 px-3 pb-3 pt-2 position-static">
                <Group>
                  <Badge>Exam</Badge>
                  <Breadcrumbs className={noMarginBreadcrumb}>
                    <Link
                      to={`/category/${result.category_slug}`}
                      className="text-primary"
                    >
                      {result.category_displayname}
                    </Link>
                  </Breadcrumbs>
                </Group>
                <h6>
                  <Link
                    to={`/exams/${result.filename}/`}
                    className="text-primary"
                  >
                    {result.headline.map((part, i) => (
                      <HighlightedContent content={part} key={i} />
                    ))}
                  </Link>
                </h6>
                {result.pages.map(([page, _, matches]) => (
                  <Group key={page}>
                    <Box>
                      <Link
                        to={`/exams/${result.filename}/#page-${page}`}
                        className="border stretched-link position-static"
                      >
                        {page}
                      </Link>
                    </Box>
                    {matches.map((part, i) => (
                      <React.Fragment key={i}>
                        <span className="text-muted">...</span>
                        <HighlightedContent content={part} key={i} />
                        <span className="text-muted">...</span>
                        {i !== matches.length - 1 && " "}
                      </React.Fragment>
                    ))}
                  </Group>
                ))}
              </Card>
            </div>
          );
        } else if (result.type === "answer") {
          return (
            <div className="px-2" key={`answer-${result.long_id}`}>
              <Card className="mb-3 px-3 pb-3 pt-2 position-static">
                <Group>
                  <Badge>Answer</Badge>
                  <Breadcrumbs className={noMarginBreadcrumb}>
                    <Link
                      to={`/category/${result.category_slug}`}
                      className="text-primary"
                    >
                      {result.category_displayname}
                    </Link>
                    <Link
                      to={`/exams/${result.filename}`}
                      className="text-primary"
                    >
                      {result.exam_displayname}
                    </Link>
                  </Breadcrumbs>
                </Group>
                <div className="position-relative">
                  <Link
                    className="text-primary stretched-link"
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
              <Card className="mb-3 px-3 pb-3 pt-2 position-static">
                <Group>
                  <Badge>Comment</Badge>
                  <Breadcrumbs className={noMarginBreadcrumb}>
                    <Link
                      className="text-primary"
                      to={`/category/${result.category_slug}`}
                    >
                      {result.category_displayname}
                    </Link>
                    <Link
                      className="text-primary"
                      to={`/exams/${result.filename}`}
                    >
                      {result.exam_displayname}
                    </Link>
                  </Breadcrumbs>
                </Group>
                <div className="position-relative">
                  <Link
                    className="text-primary stretched-link"
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
    </div>
  );
});
export default SearchResults;
