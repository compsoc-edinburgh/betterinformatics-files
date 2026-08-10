import React, { useState } from "react";
import {
  PageListResponseItem,
  PageResponse,
  PageUpdateRequest,
} from "../api/model";
import { Group, Paper, TextInput, Title } from "@mantine/core";
import MarkdownText from "./markdown-text";
import { IconMenu3 } from "@tabler/icons-react";
import style from "./page-article.module.css";
import Editor from "./Editor";
import { UndoStack } from "./Editor/utils/undo-stack";
import { GuideSidebarRight } from "./guide-sidebar-right";
import { useTableOfContents } from "../hooks/useTableOfContents";
import { useUpdatePage } from "../api/hooks/pages";
import useForm from "../hooks/useForm";
import { parseISO } from "date-fns";

export const PageArticle: React.FC<{
  page: PageResponse;
  parentPages: PageListResponseItem[];
  refetch: () => void;
  onDelete: () => void;
}> = ({ page, parentPages, refetch, onDelete }) => {
  const toc = useTableOfContents(page.content);
  const [editing, setEditing] = useState(false);

  const { mutate: updatePage, isPending: isMutating } = useUpdatePage({
    mutation: {
      onSuccess: () => {
        setEditing(false);
        refetch();
      },
    },
  });

  const { registerInput, formState, setFormValue, onSubmit } = useForm(
    {
      // Initial values
      content: page.content,
      title: page.title,
      category: page.category,
      parents: page.parents,
      is_anonymous: false,
      revision_message: "Updated via frontend",
    } as PageUpdateRequest,
    data => {
      updatePage({
        slug: page.slug,
        data,
      });
    },
  );

  const hasUnsavedChanges =
    formState.content !== page.content || formState.title !== page.title;

  const [undoStack, setUndoStack] = useState<UndoStack>({ prev: [], next: [] });

  return (
    <>
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
            classNames={{
              input: style.editingTitle,
            }}
            size="lg"
            {...registerInput("title")}
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
            allowOfficialAnswer={false}
            imageHandler={file => {
              throw new Error("Function not implemented");
            }}
            undoStack={undoStack}
            setUndoStack={setUndoStack}
            preview={value => <MarkdownText value={value} />}
            /* Manually unpack registerInput since Editor takes a different type for onChange */
            value={formState.content}
            onChange={value => {
              setFormValue("content", value);
            }}
          />
        ) : (
          <MarkdownText value={page.content} />
        )}
      </Paper>
      <GuideSidebarRight
        toc={toc}
        parentPages={parentPages}
        updatedAt={parseISO(page.edited_at)}
        createdAt={parseISO(page.created_at)}
        author={page.author}
        editing={editing}
        editAnonymously={registerInput("is_anonymous")}
        revisionMessage={registerInput("revision_message")}
        hasUnsavedChanges={hasUnsavedChanges}
        setEditing={setEditing}
        isMutating={isMutating}
        onSave={onSubmit}
        onDelete={onDelete}
      />
    </>
  );
};
