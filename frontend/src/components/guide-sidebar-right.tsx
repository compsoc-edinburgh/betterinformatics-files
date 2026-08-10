import React from "react";
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

export const GuideSidebarRight: React.FC<{
  toc: TableOfContentsEntry[];
  parentPages: PageListResponseItem[];
  updatedAt?: Date;
  createdAt?: Date;
  author?: PageAuthorResponse;
  editing: boolean;
  editAnonymously: ReturnType<ReturnType<typeof useForm>["registerInput"]>;
  revisionMessage: ReturnType<ReturnType<typeof useForm>["registerInput"]>;
  hasUnsavedChanges: boolean;
  setEditing: (editing: boolean) => void;
  onSave: React.SubmitEventHandler<HTMLFormElement>;
  isMutating: boolean;
}> = ({
  toc,
  parentPages,
  updatedAt,
  createdAt,
  author,
  editing,
  editAnonymously,
  revisionMessage,
  hasUnsavedChanges,
  setEditing,
  onSave,
  isMutating,
}) => {
  const user = useUser();

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
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
            <Button
              size="compact-sm"
              variant="filled"
              loading={isMutating}
              type="submit"
            >
              Save
            </Button>
          </Group>
        </form>
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
      <Divider my="md" w="100%" />
      <dl>
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
              <Tooltip
                label={!author.anonymised && `@${author.username}`}
                withArrow
              >
                <Text size="xs" c="gray.5">
                  {author.anonymised ? "Anonymous" : author.display_name}
                </Text>
              </Tooltip>
            </dd>
          </>
        )}
      </dl>
    </Stack>
  );
};
