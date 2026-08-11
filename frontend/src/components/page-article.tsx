import React, { useState } from "react";
import {
  PageListResponse,
  PageListResponseItem,
  PageResponse,
  PageUpdateRequest,
} from "../api/model";
import {
  Anchor,
  Fieldset,
  Group,
  MultiSelect,
  Paper,
  Select,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
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
import { useUser } from "../auth";
import { loadCategories } from "../api/hooks";
import { useRequest } from "ahooks";
import { Link, useNavigate } from "react-router-dom";

export const PageArticle: React.FC<{
  page: PageResponse;
  pages: PageListResponse;
  parentPages: PageListResponseItem[];
  refetch: () => void;
  onDelete: () => void;
}> = ({ page, pages, parentPages, refetch, onDelete }) => {
  const user = useUser();
  // Admin or owner
  const isPrivileged =
    user?.loggedin && (user.isAdmin || user.username === page.author.username);
  const isAdmin = user?.loggedin && user.isAdmin;

  const toc = useTableOfContents(page.content);
  const [editing, setEditing] = useState(false);

  const navigate = useNavigate();
  const { mutate: updatePage, isPending: isMutating } = useUpdatePage({
    mutation: {
      onSuccess: ({ slug }) => {
        setEditing(false);
        if (slug !== page.slug) {
          void navigate(`/guide/${slug}`);
        }
        // Regardless, refetch to refresh sidebar
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
      slug: page.slug,
      parents: page.parents,
      is_anonymous: false,
      revision_message: "",
    } as PageUpdateRequest,
    data => {
      updatePage({
        slug: page.slug,
        data,
      });
    },
  );

  const {
    error: categoriesError,
    loading: categoriesLoading,
    data: categories,
  } = useRequest(loadCategories, {
    ready: editing && isPrivileged,
  });

  const hasUnsavedChanges =
    formState.content !== page.content ||
    formState.title !== page.title ||
    formState.category !== page.category ||
    formState.parents !== page.parents;

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
          <Group justify="space-between">
            <Title order={1} mb="md">
              {page.title}
            </Title>
            <Anchor
              component={Link}
              to={`/guide/${page.slug}/history`}
              size="sm"
            >
              <Text c="dimmed" size="sm">
                {page.revision_count} revisions
              </Text>
            </Anchor>
          </Group>
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
          <MarkdownText value={page.content} addAnchors={true} />
        )}
        {editing && isPrivileged && (
          <Fieldset legend="Privileged Actions">
            <TextInput label="Slug" {...registerInput("slug")} />
            <MultiSelect
              label="Parent Pages"
              data={pages.pages
                .filter(p => p.slug !== page.slug)
                .map(p => ({ value: p.slug, label: p.title }))}
              value={formState.parents}
              onChange={value => setFormValue("parents", value)}
            />
            {isAdmin && (
              <Select
                label="Associated Category"
                data={
                  categories?.map(c => ({
                    value: c.slug,
                    label: c.displayname,
                  })) ?? []
                }
                value={formState.category}
                onChange={value => setFormValue("category", value)}
                disabled={!!categoriesError}
                loading={categoriesLoading}
                error={
                  categoriesError ? "Failed to load categories" : undefined
                }
              />
            )}
          </Fieldset>
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
