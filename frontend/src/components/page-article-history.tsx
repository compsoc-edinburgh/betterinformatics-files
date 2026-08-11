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
import { PageAuthorResponse, PageResponse } from "../api/model";
import { useListRevisions, useRedactRevision } from "../api/hooks/pages";
import { useState } from "react";
import CodeBlock from "./code-block";
import { IconArrowLeft, IconChevronRight } from "@tabler/icons-react";
import { formatISO } from "date-fns";
import { Link } from "react-router-dom";
import style from "./page-article.module.css";
import displayNameClasses from "../utils/display-name.module.css";

interface UserRenderProps {
  user: PageAuthorResponse;
  can_see_anonymised?: boolean;
}

const UserRender: React.FC<UserRenderProps> = ({
  user,
  can_see_anonymised,
}) => {
  return (
    <Text>
      {!user.anonymised && user.username && (
        <Anchor
          component={Link}
          to={`/user/${user.username}`}
          underline="never"
          className={displayNameClasses.shrinkableDisplayName}
        >
          {user.display_name !== user.username && (
            <>
              <Text component="span">{user.display_name}</Text>
              <Text ml="0.3em" c="dimmed" component="span">
                @{user.username}
              </Text>
            </>
          )}
          {user.display_name === user.username && (
            <Text component="span">@{user.username}</Text>
          )}
        </Anchor>
      )}
      {!user.anonymised && !user.username && (
        <Text component="span">{user.display_name}</Text>
      )}
      {user.anonymised && <Text component="span">Anonymous</Text>}
      {user.anonymised && user.username && can_see_anonymised && (
        <Anchor
          component={Link}
          to={`/user/${user.username}`}
          underline="never"
          className={displayNameClasses.shrinkableDisplayName}
        >
          <Text ml="0.3em" c="dimmed" component="span">
            ({user.display_name !== user.username && `${user.display_name} `}@
            {user.username})
          </Text>
        </Anchor>
      )}
      {user.anonymised && !user.username && can_see_anonymised && (
        <Text ml="0.3em" c="dimmed" component="span">
          ({user.display_name})
        </Text>
      )}
    </Text>
  );
};

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
    <Paper
      flex={1}
      style={{ overflow: "auto" }}
      p={0}
      pl="lg"
      pr="md"
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
        <Group mb="md" gap="xs">
          <ActionIcon variant="transparent">
            <IconArrowLeft size={16} />
          </ActionIcon>
          View current revision of "{page.title}"
        </Group>
      </Anchor>
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
            <Group td={revision.redacted ? "line-through" : "none"} gap="xs">
              <Anchor onClick={() => toggleRevision(revision.id)}>
                {formatISO(new Date(revision.created_at))}
              </Anchor>
              <UserRender
                user={revision.author}
                can_see_anonymised={
                  user.isAdmin || user.username === revision.author.username
                }
              />
              <i>({revision.message})</i>
            </Group>
            {user.isAdmin && (
              <Anchor onClick={() => toggleRedaction(revision.id)}>
                (Redact)
              </Anchor>
            )}
          </Group>
          {(!revision.redacted || user.isAdmin) && (
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
