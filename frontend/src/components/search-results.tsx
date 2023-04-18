import { Anchor, Badge, Box, Breadcrumbs, Card, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { css } from "@emotion/css";
import { escapeRegExp } from "lodash-es";
import React from "react";
import { Link } from "react-router-dom";
import MarkdownText from "../components/markdown-text";
import { HighlightedMatch, SearchResponse } from "../interfaces";

const columnStyle = css`
  column-gap: 0.75em;
  grid-column-gap: 0.75em;
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
              <Card withBorder shadow="sm" mb="sm" p="md" className="position-static">
                <Group>
                  <Badge>Exam</Badge>
                  <Breadcrumbs separator="›" className={noMarginBreadcrumb}>
                    <Anchor
                      tt="uppercase"
                      size="xs"
                      component={Link}
                      to={`/category/${result.category_slug}`}
                      className="text-primary"
                    >
                      {result.category_displayname}
                    </Anchor>
                  </Breadcrumbs>
                </Group>
                <Title py="xs" order={4}>
                  <Anchor
                    component={Link}
                    to={`/exams/${result.filename}/`}
                    className="text-primary"
                  >
                    {result.headline.map((part, i) => (
                      <HighlightedContent content={part} key={i} />
                    ))}
                  </Anchor>
                </Title>
                {result.pages.map(([page, _, matches]) => (
                  <Group key={page}>
                    <Link
                      to={`/exams/${result.filename}/#page-${page}`}
                      className="border stretched-link position-static"
                      style={{ textDecoration: "none" }}
                    >
                      <Paper
                        withBorder
                        py="xs"
                        px="md"
                        style={{ position: "static", flex: "0 0 auto" }}
                      >
                        <Text>
                          {page}
                        </Text>
                      </Paper>
                    </Link>
                    <Stack style={{ flexGrow: "1", flexBasis: "0" }}>
                      {matches.map((part, i) => (
                        <Box key={i} >
                          <Text component="span" color="dimmed">... </Text>
                          <HighlightedContent content={part} key={i} />
                          <Text component="span" color="dimmed"> ...</Text>
                          {i !== matches.length - 1 && " "}
                        </Box>
                      ))}
                    </Stack>
                  </Group>
                ))}
              </Card>
            </div>
          );
        } else if (result.type === "answer") {
          return (
            <div className="px-2" key={`answer-${result.long_id}`}>
              <Card withBorder shadow="sm" mb="sm" p="md" className="position-static">
                <Group>
                  <Badge>Answer</Badge>
                  <Breadcrumbs separator="›" className={noMarginBreadcrumb}>
                    <Anchor
                      tt="uppercase"
                      size="xs"
                      component={Link}
                      to={`/category/${result.category_slug}`}
                      className="text-primary"
                    >
                      {result.category_displayname}
                    </Anchor>
                    <Anchor
                      tt="uppercase"
                      size="xs"
                      component={Link}
                      to={`/exams/${result.filename}`}
                      className="text-primary"
                    >
                      {result.exam_displayname}
                    </Anchor>
                  </Breadcrumbs>
                </Group>
                <div className="position-relative">
                  <Anchor
                    component={Link}
                    to={`/exams/${result.filename}/#${result.long_id}`}
                  >
                    <Title py="xs" order={4}>{result.author_displayname}</Title>
                  </Anchor>
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
              <Card withBorder shadow="sm" mb="sm" p="md" className="position-static">
                <Group>
                  <Badge>Comment</Badge>
                  <Breadcrumbs separator="›" className={noMarginBreadcrumb}>
                    <Anchor
                      tt="uppercase"
                      size="xs"
                      component={Link}
                      className="text-primary"
                      to={`/category/${result.category_slug}`}
                    >
                      {result.category_displayname}
                    </Anchor>
                    <Anchor
                      tt="uppercase"
                      size="xs"
                      component={Link}
                      className="text-primary"
                      to={`/exams/${result.filename}`}
                    >
                      {result.exam_displayname}
                    </Anchor>
                  </Breadcrumbs>
                </Group>
                <div className="position-relative">
                  <Anchor
                    component={Link}
                    to={`/exams/${result.filename}/#${result.long_id}`}
                  >
                    <Title py="xs" order={4}>{result.author_displayname}</Title>
                  </Anchor>
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
