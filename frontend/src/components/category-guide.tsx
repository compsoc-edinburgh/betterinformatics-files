import { Anchor, Group, Text } from "@mantine/core";
import { PageResponse } from "../api/model";
import { Link } from "react-router-dom";
import { PageArticleContent } from "./page-article-content";

export const CategoryGuide: React.FC<{
  page?: PageResponse;
}> = ({ page }) => {
  return (
    <>
      {page && (
        <Group
          justify="flex-end"
          pos="absolute"
          right={0}
          top={0}
          px="xs"
          bdrs="sm"
          bg="var(--mantine-color-gray-light)"
        >
          <Anchor component={Link} to={`/guide/${page.slug}/history`} size="sm">
            <Text c="dimmed" size="sm">
              {page.revision_count} revisions
            </Text>
          </Anchor>
          <Anchor
            component={Link}
            to={`/guide/${page.slug}/edit?from=category`}
            size="sm"
          >
            Edit
          </Anchor>
        </Group>
      )}
      {page && <PageArticleContent page={page} />}
    </>
  );
};
