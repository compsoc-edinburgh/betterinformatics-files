import React, { useState } from "react";
import {
  PageListResponse,
  PageListResponseItem,
  PageResponse,
} from "../api/model";
import {
  ActionIcon,
  Anchor,
  Divider,
  Fieldset,
  Flex,
  Group,
  List,
  MultiSelect,
  Paper,
  Select,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import MarkdownText, { slugifyHeading } from "./markdown-text";
import { IconBook, IconHierarchy } from "@tabler/icons-react";
import style from "./page-article.module.css";
import Editor from "./Editor";
import { UndoStack } from "./Editor/utils/undo-stack";
import { GuideSidebarRight } from "./guide-sidebar-right";
import { useTableOfContents } from "../hooks/useTableOfContents";
import { useListPages, useUpdatePage } from "../api/hooks/pages";
import useForm from "../hooks/useForm";
import { useUser } from "../auth";
import { loadCategories } from "../api/hooks";
import { useRequest } from "ahooks";
import { Link, useMatch, useNavigate, useSearchParams } from "react-router-dom";
import { Turnstile } from "@marsidev/react-turnstile";
import { ExtremelyTrustedHTML } from "./extremely-trusted-html";
import { usePendingImages } from "./Editor/pending-images";
import { HtmlEditor } from "./html-editor";
import useTitle from "../hooks/useTitle";
import { PageArticleContent } from "./page-article-content";
import serverData from "../utils/server-data";

export const PageArticle: React.FC<{
  page: PageResponse;
  pages: PageListResponse;
  parentPages: PageListResponseItem[];
  refetch: () => void;
  onDelete: () => void;
}> = ({ page, pages, parentPages, refetch, onDelete }) => {
  useTitle(page.title);
  const user = useUser();
  // Admin or owner
  const isPrivileged =
    user?.loggedin && (user.isAdmin || user.username === page.author.username);
  const isAdmin = user?.loggedin && user.isAdmin;

  const match = useMatch(`/guide/${page.slug}/edit`);
  const [searchParams, _] = useSearchParams();

  const { data: childPagesWithCat } = useListPages(
    {
      child_of: page.slug,
    },
    {
      query: {
        select: data => data.pages.filter(p => p.category),
      },
    },
  );

  const toc = useTableOfContents(`# ${page.title}\n\n${page.content}`);

  const editing = match !== null;

  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const navigate = useNavigate();
  const {
    mutate: updatePage,
    isPending: isMutating,
    error: updatePageError,
  } = useUpdatePage({
    mutation: {
      onSuccess: ({ slug }) => {
        // refetch to refresh sidebar
        refetch();
        if (searchParams.get("from") === "category" && page.category) {
          void navigate(`/category/${page.category.slug}`);
        } else {
          void navigate(`/guide/${slug}`);
        }
        // Reset revision message
        setFormValue("revision_message", "");
      },
    },
    request: {
      method: "PUT", // will be overridden anyway by orval definition
      headers: {
        "X-Turnstile-Token": turnstileToken ?? "",
      },
    },
  });

  const { deferredImageHandler, flushPendingImages, pendingObjectUrls } =
    usePendingImages();
  const { registerInput, registerCheckbox, formState, setFormValue, onSubmit } =
    useForm(
      {
        // Initial values
        content: page.content,
        title: page.title,
        category: page.category?.slug ?? null,
        slug: page.slug,
        parents: page.parents,
        is_anonymous: false,
        revision_message: "",
      },
      async data => {
        data.content = await flushPendingImages(data.content);
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
    formState.category !== (page.category?.slug ?? null) ||
    formState.parents !== page.parents;

  const [undoStack, setUndoStack] = useState<UndoStack>({ prev: [], next: [] });

  return (
    <Flex
      direction={{ base: "column", sm: "row" }}
      align={{ base: "stretch", sm: "flex-start" }}
      gap="xs"
      flex={1}
    >
      <Paper
        pl={{ base: 0, sm: editing ? "xs" : "lg" }}
        pr={{ base: 0, sm: "md" }}
        pb="md"
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
          <Group
            justify="space-between"
            wrap="nowrap"
            align="flex-start"
            mb="md"
          >
            <Title order={1} id={slugifyHeading(page.title)}>
              {page.title}
            </Title>
            <Anchor
              component={Link}
              to={`/guide/${page.slug}/history`}
              size="sm"
            >
              <Text c="dimmed" size="sm" className={style.revisionCount}>
                {page.revision_count} revisions
              </Text>
            </Anchor>
          </Group>
        )}
        {page.category && !editing && (
          <Anchor component={Link} to={`/category/${page.category.slug}`}>
            <Group gap="xs" mb="md" wrap="nowrap" align="flex-start">
              <ActionIcon variant="transparent">
                <IconBook size={16} />
              </ActionIcon>
              View in Context of "{page.category.displayname}"
            </Group>
          </Anchor>
        )}
        {editing ? (
          page.kind === "static_html" ? (
            <HtmlEditor
              value={formState.content}
              onChange={value => setFormValue("content", value)}
              imageHandler={deferredImageHandler}
              undoStack={undoStack}
              setUndoStack={setUndoStack}
              preview={value => <ExtremelyTrustedHTML html={value} />}
            />
          ) : (
            <Editor
              allowOfficialAnswer={false}
              imageHandler={deferredImageHandler}
              undoStack={undoStack}
              setUndoStack={setUndoStack}
              preview={value => (
                <MarkdownText
                  value={value}
                  addAnchors={true}
                  localLinkBase="https://betterinformatics.com"
                  ignoreHtml={true}
                  pendingImages={pendingObjectUrls}
                />
              )}
              /* Manually unpack registerInput since Editor takes a different type for onChange */
              value={formState.content}
              onChange={value => {
                setFormValue("content", value);
              }}
            />
          )
        ) : (
          <PageArticleContent page={page} />
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
                searchable
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
        {!editing && childPagesWithCat && childPagesWithCat.length > 0 && (
          <>
            <Divider my="lg" />
            <Group gap="xs" mt="md" mb="xs">
              <IconHierarchy size={16} />
              <Title
                order={2}
                fz="h6"
                style={{ textTransform: "uppercase" }}
                opacity={0.8}
              >
                Relevant Categories
              </Title>
            </Group>
            <List>
              {childPagesWithCat.map(page => (
                <List.Item key={page.slug}>
                  <Anchor
                    component={Link}
                    to={`/category/${page.category?.slug}/guide`}
                  >
                    {page.category?.displayname}
                  </Anchor>
                </List.Item>
              ))}
            </List>
          </>
        )}
        {!editing && !user?.isAdmin && (
          <Turnstile
            siteKey={serverData.turnstile_sitekey}
            onSuccess={setTurnstileToken}
            options={{
              action: "update_page",
            }}
          />
        )}
      </Paper>
      <GuideSidebarRight
        page={page}
        toc={toc}
        parentPages={parentPages}
        editing={editing}
        editAnonymously={registerCheckbox("is_anonymous")}
        revisionMessage={registerInput("revision_message")}
        hasUnsavedChanges={hasUnsavedChanges}
        isMutating={isMutating}
        onSave={onSubmit}
        error={updatePageError}
        onDelete={onDelete}
        captchaReady={user?.isAdmin || turnstileToken !== null}
      />
    </Flex>
  );
};
