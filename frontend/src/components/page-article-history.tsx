import {
  Alert,
  Collapse,
  Group,
  Paper,
  Text,
  Stack,
  ActionIcon,
  Anchor,
  Title,
} from "@mantine/core";
import { useUser } from "../auth";
import { PageResponse } from "../api/model";
import { useListRevisions, useRedactRevision } from "../api/hooks/pages";
import { useState } from "react";
import CodeBlock from "./code-block";
import { IconArrowLeft, IconChevronRight } from "@tabler/icons-react";
import { formatISO } from "date-fns";
import { Link } from "react-router-dom";
import style from "./page-article.module.css";
import { PageUserRender } from "./page-user-render";

export const PageArticleHistory: React.FC<{
  page: PageResponse;
}> = ({ page }) => {
  const user = useUser();

  const {
    data: revisions,
    isLoading,
    isError,
    refetch,
  } = useListRevisions(page.slug);

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

  const { mutate: setRedaction } = useRedactRevision({
    mutation: {
      onSuccess: () => {
        void refetch();
      },
    },
  });

  const toggleRedaction = (revisionId: number) => {
    const revision = revisions?.revisions.find(r => r.id === revisionId);
    if (!revision) {
      return;
    }
    setRedaction({
      slug: page.slug,
      revisionId,
      data: {
        redacted: !revision.redacted,
      },
    });
  };

  return (
    <Paper
      flex={1}
      style={{ overflow: "auto" }}
      pl={{ base: 0, sm: "lg" }}
      pr={{ base: 0, sm: "md" }}
      radius={0}
      shadow="none"
      className={
        style.pageArticle /* Component must be Paper to use var(--paper-border-color) */
      }
    >
      <Title order={1} mb="md">
        {page.title}: Revision History
      </Title>
      <Anchor component={Link} to={`/guide/${page.slug}`}>
        <Group mb="md" gap="xs" wrap="nowrap" align="flex-start">
          <ActionIcon variant="transparent">
            <IconArrowLeft size={16} />
          </ActionIcon>
          View current revision of "{page.title}"
        </Group>
      </Anchor>
      {!user?.loggedin ? (
        <Alert flex={1} title="Login Required">
          You must be logged in to view the revision history of this page.
        </Alert>
      ) : isLoading ? (
        "Loading..."
      ) : (
        isError && "There was an error loading the revision history."
      )}
      {revisions?.revisions.map(revision => (
        <Stack key={revision.id} gap={0} w="100%">
          <Group gap="xs" wrap="nowrap" align="flex-start">
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
            <Text>
              <Text
                td={revision.redacted ? "line-through" : "none"}
                component="span"
                mr="xs"
              >
                <Anchor
                  onClick={() => toggleRevision(revision.id)}
                  mr="xs"
                  style={{ whiteSpace: "nowrap" }}
                >
                  {formatISO(new Date(revision.created_at))}
                </Anchor>
                <PageUserRender
                  user={revision.author}
                  can_see_anonymised={
                    user &&
                    (user.isAdmin || user.username === revision.author.username)
                  }
                />
                <i>({revision.message})</i>
              </Text>
              {user?.isAdmin && (
                <Anchor onClick={() => toggleRedaction(revision.id)}>
                  (Redact)
                </Anchor>
              )}
            </Text>
          </Group>
          {(!revision.redacted || user?.isAdmin) && (
            <Collapse expanded={expandedRevisions.has(revision.id)}>
              {revision.title_delta && (
                <CodeBlock
                  value={revision.title_delta}
                  language="diff"
                  customStyle={{ lineHeight: 1 }}
                />
              )}
              {revision.content_delta && (
                <CodeBlock
                  value={revision.content_delta}
                  language="diff"
                  customStyle={{ lineHeight: 1 }}
                />
              )}
              {!revision.title_delta && !revision.content_delta && (
                <Text c="dimmed" size="sm" p="sm">
                  Changes were in metadata only.
                </Text>
              )}
            </Collapse>
          )}
        </Stack>
      ))}
    </Paper>
  );
};
