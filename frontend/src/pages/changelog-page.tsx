import * as React from "react";
import { Container, Timeline, Group, Badge, Paper, Title } from "@mantine/core";
import { versions } from "../utils/changelog";
import MarkdownText from "../components/markdown-text";
import useTitle from "../hooks/useTitle";
import { useChangelog } from "../hooks/useChangelog";

const ChangelogPage: React.FC = () => {
  useTitle("What's New");

  const { lastSeen, dismiss } = useChangelog();

  // Remember the first value so we can set local storage without triggering
  // a re-render
  const [lastSeenState, _] = React.useState(lastSeen);

  const numberOfNewEntries =
    versions.findIndex(v => v.version === lastSeenState) - 1;

  // Dismiss in background after 1 second on the page
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      dismiss();
    }, 1000);
    return () => clearTimeout(timeout);
  }, [dismiss]);

  return (
    <Container size="xl">
      <Timeline
        active={numberOfNewEntries !== -1 ? numberOfNewEntries : -1}
        radius="md"
        bulletSize={36}
      >
        {versions.map((version, index) => {
          return (
            <Timeline.Item
              title={
                <Group wrap="nowrap" gap="xs" mb="lg">
                  <Title order={2}>{version.version}</Title>
                  {index <= numberOfNewEntries && (
                    <Badge color="brand">New since your last visit</Badge>
                  )}
                </Group>
              }
              key={version.version}
            >
              <Paper
                withBorder
                p="md"
                style={
                  index <= numberOfNewEntries
                    ? { borderLeft: "2px solid var(--mantine-color-brand-6)" }
                    : {}
                }
              >
                <MarkdownText value={version.content} />
              </Paper>
            </Timeline.Item>
          );
        })}
      </Timeline>
    </Container>
  );
};

export default ChangelogPage;
