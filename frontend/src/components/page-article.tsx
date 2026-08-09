import React from "react";
import { PageResponse } from "../api/model";
import { Group, Paper, Title } from "@mantine/core";
import MarkdownText from "./markdown-text";
import { IconMenu3 } from "@tabler/icons-react";
import style from "./page-article.module.css";

export const PageArticle: React.FC<{
  page: PageResponse;
  editing: boolean;
  setEditing: (editing: boolean) => void;
}> = ({ page, editing, setEditing }) => {
  return (
    <Paper
      p={0}
      pl="lg"
      radius={0}
      shadow="none"
      className={
        style.pageArticle /* Component must be Paper to use var(--paper-border-color) */
      }
    >
      <Title order={1} mb="md">
        {page.title}
      </Title>
      {page.category && (
        <>
          <Group gap="xs" mb="md">
            <IconMenu3 size={16} />
            <Title
              order={2}
              fz="h6"
              style={{ textTransform: "uppercase" }}
              opacity={0.8}
            >
              Go back to {page.category}
            </Title>
          </Group>
        </>
      )}
      <MarkdownText value={page.content} />
    </Paper>
  );
};
