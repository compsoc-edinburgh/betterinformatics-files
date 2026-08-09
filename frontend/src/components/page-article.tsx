import React, { useState } from "react";
import { PageResponse } from "../api/model";
import { Group, Paper, TextInput, Title } from "@mantine/core";
import MarkdownText from "./markdown-text";
import { IconMenu3 } from "@tabler/icons-react";
import style from "./page-article.module.css";
import Editor from "./Editor";
import { UndoStack } from "./Editor/utils/undo-stack";

export const PageArticle: React.FC<{
  page: PageResponse;
  editing: boolean;
  setEditing: (editing: boolean) => void;
}> = ({ page, editing }) => {
  const [editingTitle, setEditingTitle] = useState(page.title);
  const [editingContent, setEditingContent] = useState(page.content);
  const [undoStack, setUndoStack] = useState<UndoStack>({ prev: [], next: [] });

  return (
    <Paper
      p={0}
      pl={editing ? "xs" : "lg"}
      pr="md"
      radius={0}
      shadow="none"
      className={
        style.pageArticle /* Component must be Paper to use var(--paper-border-color) */
      }
    >
      {editing ? (
        <TextInput
          placeholder="Title"
          value={editingTitle}
          onChange={e => setEditingTitle(e.target.value)}
          classNames={{
            input: style.editingTitle,
          }}
          size="lg"
        />
      ) : (
        <Title order={1} mb="md">
          {page.title}
        </Title>
      )}
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
      {editing ? (
        <Editor
          value={editingContent}
          allowOfficialAnswer={false}
          onChange={setEditingContent}
          imageHandler={file => {
            throw new Error("Function not implemented");
          }}
          undoStack={undoStack}
          setUndoStack={setUndoStack}
          preview={value => <MarkdownText value={value} />}
        />
      ) : (
        <MarkdownText value={page.content} />
      )}
    </Paper>
  );
};
