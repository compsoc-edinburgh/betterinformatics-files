import React, { useEffect } from "react";
import {
  Anchor,
  Button,
  Divider,
  Group,
  Stack,
  TextInput,
  Title,
  Text,
  Tooltip,
  Switch,
} from "@mantine/core";
import { IconMenu3, IconPencil } from "@tabler/icons-react";
import { PageAuthorResponse, PageListResponseItem } from "../api/model";
import { TableOfContentsEntry } from "../hooks/useTableOfContents";
import { formatISO, formatRelative } from "date-fns";
import { useUser } from "../auth";
import style from "./guide-sidebar-right.module.css";
import { clsx } from "clsx";
import useForm from "../hooks/useForm";
import useRemoveConfirm from "../hooks/useRemoveConfirm";
import { Link } from "react-router-dom";
import { PageUserRender } from "./page-user-render";

export const GuideSidebarRight: React.FC<{
  slug: string;
  toc: TableOfContentsEntry[];
  parentPages: PageListResponseItem[];
  updatedAt?: Date;
  createdAt?: Date;
  author?: PageAuthorResponse;
  editing: boolean;
  editAnonymously: ReturnType<ReturnType<typeof useForm>["registerInput"]>;
  revisionMessage: ReturnType<ReturnType<typeof useForm>["registerInput"]>;
  hasUnsavedChanges: boolean;
  onSave: React.SubmitEventHandler<HTMLFormElement>;
  onDelete: () => void;
  isMutating: boolean;
  captchaReady: boolean;
  captchaExecute: () => Promise<string | undefined>;
}> = ({
  slug,
  toc,
  parentPages,
  updatedAt,
  createdAt,
  author,
  editing,
  editAnonymously,
  revisionMessage,
  hasUnsavedChanges,
  onSave,
  onDelete,
  isMutating,
  captchaReady,
  captchaExecute,
}) => {
  const user = useUser();

  // Admin or owner
  const canDelete =
    user?.loggedin && (user.isAdmin || user.username === author?.username);
  const [removeConfirm, modals] = useRemoveConfirm();

  // Start verifying immediately when editing starts
  const [verifying, setVerifying] = React.useState(true);
  useEffect(() => {
    if (!editing) return;
    if (!captchaReady) return;
    void captchaExecute().then(token => {
      if (!token) return;
      setVerifying(false);
    });
  }, [editing, captchaReady, captchaExecute]);

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
        <form
          className={clsx(
            style.editingActions,
            hasUnsavedChanges && style.unsaved,
          )}
          onSubmit={onSave}
        >
          <TextInput
            label="Describe your changes"
            w="100%"
            required
            {...revisionMessage}
          />
          <Switch label={"Edit Anonymously"} {...editAnonymously} />
          <Group gap="xs" justify="space-between">
            <Button
              size="compact-sm"
              variant="outline"
              component={Link}
              to={`/guide/${slug}`}
            >
              Cancel
            </Button>
            <Button
              size="compact-sm"
              variant="filled"
              loading={isMutating || verifying}
              type="submit"
              disabled={!hasUnsavedChanges || isMutating}
            >
              Save
            </Button>
          </Group>
        </form>
      ) : (
        <Group gap="xs">
          <Button
            size="compact-sm"
            variant="outline"
            component={Link}
            to={`/guide/${slug}/edit`}
          >
            Edit
          </Button>
          {canDelete && (
            <Button
              size="compact-sm"
              variant="transparent"
              color="red"
              onClick={() =>
                removeConfirm(
                  "Are you sure you want to delete this page?",
                  onDelete,
                )
              }
            >
              Delete
            </Button>
          )}
        </Group>
      )}
      {toc.length > 0 && (
        <>
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
        </>
      )}
      {parentPages.length > 0 && (
        <>
          <Group gap="xs" my="md">
            <IconMenu3 size={16} />
            <Title
              order={2}
              fz="h6"
              style={{ textTransform: "uppercase" }}
              opacity={0.8}
            >
              This page is part of
            </Title>
          </Group>
          {parentPages.map(page => (
            <Anchor
              display="block"
              key={page.slug}
              component={Link}
              to={`/guide/${page.slug}`}
            >
              {page.title}
            </Anchor>
          ))}
        </>
      )}
      <Divider my="md" w="100%" />
      <dl className={style.dl}>
        {updatedAt && (
          <>
            <dt className={style.dlHeading}>
              <Text size="xs" c="gray.5">
                Last Updated
              </Text>
            </dt>
            <dd className={style.dlData}>
              <Tooltip label={formatISO(updatedAt)} withArrow>
                <Text size="xs" c="gray.5">
                  {formatRelative(updatedAt, new Date())}
                </Text>
              </Tooltip>
            </dd>
          </>
        )}
        {createdAt && (
          <>
            <dt className={style.dlHeading}>
              <Text size="xs" c="gray.5">
                Created
              </Text>
            </dt>
            <dd className={style.dlData}>
              <Tooltip label={formatISO(createdAt)} withArrow>
                <Text size="xs" c="gray.5">
                  {formatRelative(createdAt, new Date())}
                </Text>
              </Tooltip>
            </dd>
          </>
        )}
        {author && user?.loggedin && (
          <>
            <dt className={style.dlHeading}>
              <Text size="xs" c="gray.5">
                Created by
              </Text>
            </dt>
            <dd className={style.dlData}>
              <PageUserRender
                user={author}
                can_see_anonymised={
                  user.isAdmin || user.username === author.username
                }
                size="xs"
                c="gray.5"
              />
            </dd>
          </>
        )}
      </dl>
      {modals}
    </Stack>
  );
};
