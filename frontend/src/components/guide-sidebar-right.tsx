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
  Alert,
} from "@mantine/core";
import { IconMenu3, IconPencil, IconSitemap } from "@tabler/icons-react";
import { ErrorSchema, PageListResponseItem, PageResponse } from "../api/model";
import {
  TableOfContentsEntry,
  ToCContainer,
  ToCItem,
} from "../hooks/useTableOfContents";
import { formatRelative, parseISO } from "date-fns";
import { useUser } from "../auth";
import style from "./guide-sidebar-right.module.css";
import { clsx } from "clsx";
import useForm from "../hooks/useForm";
import useRemoveConfirm from "../hooks/useRemoveConfirm";
import { Link } from "react-router-dom";
import { PageUserRender } from "./page-user-render";

export const GuideSidebarRight: React.FC<{
  page: PageResponse;
  toc: TableOfContentsEntry[];
  parentPages: PageListResponseItem[];
  editing: boolean;
  editAnonymously: ReturnType<ReturnType<typeof useForm>["registerInput"]>;
  revisionMessage: ReturnType<ReturnType<typeof useForm>["registerInput"]>;
  hasUnsavedChanges: boolean;
  onSave: React.SubmitEventHandler<HTMLFormElement>;
  onDelete: () => void;
  isMutating: boolean;
  error: ErrorSchema | null;
  captchaReady: boolean;
  captchaExecute: () => Promise<string | undefined>;
}> = ({
  page,
  toc,
  parentPages,
  editing,
  editAnonymously,
  revisionMessage,
  hasUnsavedChanges,
  onSave,
  onDelete,
  isMutating,
  error,
  captchaReady,
  captchaExecute,
}) => {
  const user = useUser();

  const canEdit = page.kind === "guide" || !!user?.isAdmin;
  // Admin or owner
  const canDelete =
    !!user?.loggedin &&
    canEdit &&
    (user.isAdmin || user.username === page.author.username);
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
    <Stack
      gap={0}
      align="flex-start"
      pos={{ base: "relative", sm: "sticky" }}
      miw="200px"
      top={{ base: 0, sm: "4rem" }}
      w={{ base: "100%", sm: "auto" }}
    >
      {editing ? (
        <form
          className={clsx(
            style.editingActions,
            hasUnsavedChanges && style.unsaved,
          )}
          onSubmit={onSave}
        >
          {error && (
            <Alert
              color="red"
              p="xs"
              miw="100%"
              w="0"
              style={{ wordBreak: "break-word" }}
            >
              <span>{String(error)}</span>
            </Alert>
          )}
          <TextInput
            label="Describe your changes"
            w="100%"
            required
            size="xs"
            {...revisionMessage}
          />
          <Switch label={"Edit Anonymously"} {...editAnonymously} />
          <Group gap="xs" justify="space-between">
            <Button
              size="compact-sm"
              variant="outline"
              component={Link}
              to={`/guide/${page.slug}`}
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
        canEdit && (
          <Button
            fullWidth
            size="md"
            variant="outline"
            component={Link}
            to={`/guide/${page.slug}/edit`}
            rightSection={<IconPencil size={16} />}
          >
            Edit
          </Button>
        )
      )}
      {toc.length > 0 && (
        <>
          <Group gap="xs" mt="md" mb="xs">
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
          <ToCContainer entries={toc}>
            {activeIndex =>
              toc.map((_, i) => (
                <ToCItem
                  key={toc[i].slug}
                  entries={toc}
                  index={i}
                  activeIndex={activeIndex}
                />
              ))
            }
          </ToCContainer>
        </>
      )}
      {parentPages.length > 0 && (
        <>
          <Group gap="xs" mt="md" mb="xs">
            <IconSitemap size={16} />
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
            <Anchor
              display="block"
              key={page.slug}
              component={Link}
              to={`/guide/${page.slug}`}
              style={{
                textDecoration: "none",
              }}
            >
              {page.title}
            </Anchor>
          ))}
        </>
      )}
      <Divider my="md" w="100%" />
      <dl className={style.dl}>
        {page.edited_at && (
          <>
            <dt className={style.dlHeading}>
              <Text size="xs" c="gray.5" component="span">
                Last Updated
              </Text>
            </dt>
            <dd className={style.dlData}>
              <Tooltip label={page.edited_at} withArrow>
                <Text size="xs" c="gray.5" component="span">
                  {formatRelative(parseISO(page.edited_at), new Date())}
                </Text>
              </Tooltip>
            </dd>
          </>
        )}
        {page.created_at && (
          <>
            <dt className={style.dlHeading}>
              <Text size="xs" c="gray.5" component="span">
                Created
              </Text>
            </dt>
            <dd className={style.dlData}>
              <Tooltip label={page.created_at} withArrow>
                <Text size="xs" c="gray.5" component="span">
                  {formatRelative(parseISO(page.created_at), new Date())}
                </Text>
              </Tooltip>
            </dd>
          </>
        )}
        {user?.loggedin && (
          <>
            <dt className={style.dlHeading}>
              <Text size="xs" c="gray.5" component="span">
                Created by
              </Text>
            </dt>
            <dd className={style.dlData}>
              <PageUserRender
                user={page.author}
                can_see_anonymised={
                  user.isAdmin || user.username === page.author.username
                }
                size="xs"
                c="gray.5"
              />
            </dd>
          </>
        )}
        {canDelete && (
          <dt className={style.dlHeading}>
            <Tooltip label="As an admin or the page owner, you can delete this page.">
              <Anchor
                size="xs"
                c="gray.5"
                component="span"
                onClick={() =>
                  removeConfirm(
                    "Are you sure you want to delete this page?",
                    onDelete,
                  )
                }
              >
                (Delete Page)
              </Anchor>
            </Tooltip>
          </dt>
        )}
      </dl>
      {modals}
    </Stack>
  );
};
