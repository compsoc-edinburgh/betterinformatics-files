import React, { useState } from "react";
import {
  PageListResponse,
  PageListResponseItem,
  PageResponse,
  PageUpdateRequest,
} from "../api/model";
import {
  ActionIcon,
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
import { IconBook } from "@tabler/icons-react";
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
import { Link, useMatch, useNavigate } from "react-router-dom";
import { useHCaptcha } from "@hcaptcha/react-hcaptcha/hooks";

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

  const match = useMatch(`/guide/${page.slug}/edit`);

  const toc = useTableOfContents(page.content);

  const editing = match !== null;

  const { ready, token, executeInstance } = useHCaptcha();

  const navigate = useNavigate();
  const { mutate: updatePage, isPending: isMutating } = useUpdatePage({
    mutation: {
      onSuccess: ({ slug }) => {
        void navigate(`/guide/${slug}`);
        // refetch to refresh sidebar
        refetch();
      },
    },
    request: {
      method: "PUT", // will be overridden anyway by orval definition
      headers: {
        "X-HCaptcha-Token": token ?? "",
      },
    },
  });

  const { registerInput, registerCheckbox, formState, setFormValue, onSubmit } =
    useForm(
      {
        // Initial values
        content: page.content,
        title: page.title,
        category: page.category?.slug,
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
    formState.slug !== page.slug ||
    formState.content !== page.content ||
    formState.title !== page.title ||
    formState.category !== page.category?.slug ||
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
            value={formState.title}
            onChange={e => setFormValue("title", e.target.value)}
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
        {page.category && !editing && (
          <Anchor component={Link} to={`/category/${page.category.slug}`}>
            <Group gap="xs" mb="md">
              <ActionIcon variant="transparent">
                <IconBook size={16} />
              </ActionIcon>
              View in Context of "{page.category.displayname}"
            </Group>
          </Anchor>
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
            <TextInput
              label="Slug"
              value={formState.slug}
              onChange={e => setFormValue("slug", e.target.value)}
            />
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
        slug={page.slug}
        toc={toc}
        parentPages={parentPages}
        updatedAt={parseISO(page.edited_at)}
        createdAt={parseISO(page.created_at)}
        author={page.author}
        editing={editing}
        editAnonymously={registerCheckbox("is_anonymous")}
        revisionMessage={registerInput("revision_message")}
        hasUnsavedChanges={hasUnsavedChanges}
        isMutating={isMutating}
        onSave={onSubmit}
        onDelete={onDelete}
        captchaReady={ready}
        captchaExecute={executeInstance}
      />
    </>
  );
};
