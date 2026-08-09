import React from "react";
import { Anchor, Button, Group, Stack, TextInput, Title } from "@mantine/core";
import { IconMenu3, IconPencil } from "@tabler/icons-react";
import { PageListResponseItem } from "../api/model";
import { TableOfContentsEntry } from "../hooks/useTableOfContents";

export const GuideSidebarRight: React.FC<{
  toc: IteratorObject<TableOfContentsEntry>;
  parentPages: PageListResponseItem[];
  editing: boolean;
  setEditing: (editing: boolean) => void;
}> = ({ toc, parentPages, editing, setEditing }) => {
  return (
    <Stack gap={0} style={{ minWidth: "200px" }} align="flex-start">
      <Group gap="xs" mb="md">
        <IconPencil size={16} />
        <Title
          order={2}
          fz="h6"
          style={{ textTransform: "uppercase" }}
          opacity={0.8}
        >
          Actions
        </Title>
      </Group>
      {editing ? (
        <>
          <TextInput label="Describe your changes" w="100%" />
          <Button
            size="compact-sm"
            variant="outline"
            onClick={() => setEditing(false)}
          >
            Save
          </Button>
        </>
      ) : (
        <Button
          size="compact-sm"
          variant="outline"
          onClick={() => setEditing(true)}
        >
          Edit
        </Button>
      )}
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
    </Stack>
  );
};
