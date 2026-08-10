import {
  Alert,
  Collapse,
  Group,
  Paper,
  Text,
  Stack,
  ActionIcon,
  Anchor,
} from "@mantine/core";
import { useUser } from "../auth";
import { PageResponse } from "../api/model";
import { useListRevisions } from "../api/hooks/pages";
import { useState } from "react";
import CodeBlock from "./code-block";
import { IconChevronRight } from "@tabler/icons-react";
import { formatISO } from "date-fns";
import { Link } from "react-router-dom";

export const PageArticleHistory: React.FC<{
  page: PageResponse;
}> = ({ page }) => {
  const user = useUser();

  const { data: revisions, isLoading, isError } = useListRevisions(page.slug);

  const [expandedRevisions, setExpandedRevisions] = useState<Set<number>>(
    new Set(),
  );

  const toggleRevision = (revisionId: number) => {
    const newExpandedRevisions = new Set(expandedRevisions);
    if (!expandedRevisions.has(revisionId)) {
      newExpandedRevisions.add(revisionId);
    } else {
      newExpandedRevisions.delete(revisionId);
    }
    setExpandedRevisions(newExpandedRevisions);
  };

  // Revisions only visible if logged in
  if (!user?.loggedin) {
    return (
      <Alert title="Login Required">
        You must be logged in to view the revision history of this page.
      </Alert>
    );
  }

  if (isLoading) {
    return "Loading...";
  }

  if (isError) {
    return (
      <Alert title="Error" color="red">
        There was an error loading the revision history.
      </Alert>
    );
  }

  return (
    <Paper flex={1} style={{ overflow: "auto" }}>
      {revisions?.revisions.map(revision => (
        <Stack key={revision.id} gap={0} w="100%">
          <Group gap="xs">
            <ActionIcon
              variant="transparent"
              onClick={() => toggleRevision(revision.id)}
            >
              <IconChevronRight
                size={16}
                style={{
                  transform: expandedRevisions.has(revision.id)
                    ? "rotate(90deg)"
                    : "none",
                }}
              />
            </ActionIcon>
            <Anchor
              td={revision.redacted ? "line-through" : "none"}
              onClick={() => toggleRevision(revision.id)}
            >
              {formatISO(new Date(revision.created_at))}
            </Anchor>
            <Text td={revision.redacted ? "line-through" : "none"}>
              {revision.author.username ? (
                <Anchor
                  component={Link}
                  to={`/user/${revision.author.username}`}
                >
                  {revision.author.display_name} ({revision.author.username})
                </Anchor>
              ) : (
                revision.author.display_name
              )}
              <i>({revision.message})</i>
            </Text>
          </Group>
          {!revision.redacted && (
            <Collapse expanded={expandedRevisions.has(revision.id)}>
              <CodeBlock value={revision.content_delta} language="diff" />
            </Collapse>
          )}
        </Stack>
      ))}
    </Paper>
  );
};
