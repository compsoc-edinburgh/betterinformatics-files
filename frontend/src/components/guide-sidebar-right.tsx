import React from "react";
import { Anchor, Button, Group, Paper, Stack, Title } from "@mantine/core";
import { IconMenu3, IconPencil } from "@tabler/icons-react";
import { PageListResponseItem } from "../api/model";
import { TableOfContentsEntry } from "../hooks/useTableOfContents";

export const GuideSidebarRight: React.FC<{
  toc: IteratorObject<TableOfContentsEntry>;
  parentPages: PageListResponseItem[];
}> = ({ toc, parentPages }) => {
  return (
    <Stack gap="xs" style={{ minWidth: "200px" }}>
      <Paper shadow="none" p="md">
        <Group gap="xs" mb="md">
          <IconPencil size={16} />
          <Title
            order={2}
            fz="h6"
            style={{ textTransform: "uppercase" }}
            opacity={0.8}
          >
            Admin
          </Title>
        </Group>
        <Button size="compact-sm" variant="outline">
          Edit
        </Button>
        <Group gap="xs" my="md">
          <IconMenu3 size={16} />
          <Title
            order={2}
            fz="h6"
            style={{ textTransform: "uppercase" }}
            opacity={0.8}
          >
            On This Page
          </Title>
        </Group>
        {toc.map(({ level, text, slug }) => (
          <Anchor
            display="block"
            key={slug}
            href={`#${slug}`}
            style={{ marginLeft: `${(level - 1) * 10}px` }}
          >
            {text}
          </Anchor>
        ))}
        {parentPages.length > 0 && (
          <>
            <Group gap="xs" mb="md">
              <IconMenu3 size={16} />
              <Title
                order={2}
                fz="h6"
                style={{ textTransform: "uppercase" }}
                opacity={0.8}
              >
                Parent Pages
              </Title>
            </Group>
            {parentPages.map(page => (
              <Anchor display="block" key={page.slug} href={`#${page.slug}`}>
                {page.title}
              </Anchor>
            ))}
          </>
        )}
      </Paper>
    </Stack>
  );
};
