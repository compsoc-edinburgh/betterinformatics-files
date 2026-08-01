/* eslint-disable @typescript-eslint/no-misused-promises */
import {
  Alert,
  Anchor,
  Breadcrumbs,
  Button,
  Card,
  Container,
  Flex,
  Group,
  Title,
  Text,
  Tabs,
  Tooltip,
  Box,
  Modal,
  Stack,
  List,
} from "@mantine/core";
import React, { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { download } from "../api/fetch-utils";
import IconButton from "../components/icon-button";
import LikeButton from "../components/like-button";
import ContentContainer from "../components/secondary-container";
import DocumentCode from "../components/document-code";
import DocumentCommentComponent from "../components/document-comment";
import DocumentCommentForm from "../components/document-comment-form";
import DocumentMarkdown from "../components/document-markdown";
import DocumentMarkdownEditor from "../components/document-markdown-editor";
import DocumentPdf from "../components/document-pdf";
import DocumentSettings from "../components/document-settings";
import { useDocumentDownload } from "../hooks/useDocumentDownload";
import MarkdownText from "../components/markdown-text";
import { formatDistanceToNow } from "date-fns";
import {
  IconArrowBigRightLine,
  IconCheck,
  IconChevronRight,
  IconDownload,
  IconEdit,
  IconFile,
  IconFileTypePdf,
  IconFileTypeZip,
  IconMessage,
  IconSettings,
  IconX,
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import displayNameClasses from "../utils/display-name.module.css";
import { useQuickSearchFilter } from "../components/Navbar/QuickSearch/QuickSearchFilterContext";
import { useScrollToPermalink } from "../hooks/useScrollToPermalink";
import { useUser, type User } from "../auth";
import type { DocumentFileSchema } from "../api/model/documentFileSchema";
import type { DocumentSchema } from "../api/model/documentSchema";
import {
  useAcceptDocumentTransfer,
  useGetDocument,
  useRejectDocumentTransfer,
} from "../api/hooks/documents";
import serverData from "../utils/server-data";
import type { UserSchema } from "../api/model";

const isPdf = (file: DocumentFileSchema) =>
  file.mime_type === "application/pdf";
const isMarkdown = (file: DocumentFileSchema) =>
  file.filename.toLowerCase().endsWith(".md");
const isTex = (file: DocumentFileSchema) =>
  file.filename.toLowerCase().endsWith(".tex");
const isTypst = (file: DocumentFileSchema) =>
  file.filename.toLowerCase().endsWith(".typ");

const getComponents = (
  file: DocumentFileSchema | undefined,
):
  | {
      Viewer: React.FC<{
        document: DocumentSchema;
        file: DocumentFileSchema;
        url: string;
      }>;
      Editor:
        | React.FC<{
            document: DocumentSchema;
            file: DocumentFileSchema;
            url: string;
          }>
        | undefined;
    }
  | undefined => {
  if (file === undefined) return undefined;

  if (isPdf(file)) {
    return { Viewer: DocumentPdf, Editor: undefined };
  }
  if (isMarkdown(file)) {
    return { Viewer: DocumentMarkdown, Editor: DocumentMarkdownEditor };
  }
  if (isTex(file) || isTypst(file)) {
    return { Viewer: DocumentCode, Editor: undefined };
  }

  return undefined;
};

const getFile = (document: DocumentSchema | undefined, oid: number) =>
  document ? document.files?.find(x => x.oid === oid) : undefined;

const FileIcon: React.FC<{ filename: string }> = ({ filename }) => {
  if (filename.endsWith(".pdf")) {
    return <IconFileTypePdf />;
  }

  if (filename.endsWith(".zip")) {
    return <IconFileTypeZip />;
  }

  return <IconFile />;
};

interface UserRenderProps {
  user: UserSchema;
  anonymised?: boolean;
  can_see_anonymised?: boolean;
}

const UserRender: React.FC<UserRenderProps> = ({
  user,
  anonymised,
  can_see_anonymised,
}) => {
  return (
    <>
      {!anonymised && (
        <Anchor
          component={Link}
          to={`/user/${user.username}`}
          underline="never"
          className={displayNameClasses.shrinkableDisplayName}
        >
          {user.display_name !== user.username && (
            <>
              <Text fw={700} component="span">
                {user.display_name}
              </Text>
              <Text ml="0.3em" c="dimmed" component="span">
                @{user.username}
              </Text>
            </>
          )}
          {user.display_name === user.username && (
            <Text fw={700} component="span">
              @{user.username}
            </Text>
          )}
        </Anchor>
      )}
      {anonymised && (
        <Text fw={700} component="span">
          Anonymous
        </Text>
      )}
      {anonymised && can_see_anonymised && (
        <Anchor
          component={Link}
          to={`/user/${user.username}`}
          underline="never"
          className={displayNameClasses.shrinkableDisplayName}
        >
          <Text ml="0.3em" c="dimmed" component="span">
            ({user.display_name !== user.username && `${user.display_name} `}@
            {user.username})
          </Text>
        </Anchor>
      )}
    </>
  );
};

interface AcceptTransferBannerProps {
  loggedInUser: User | undefined;
  document: DocumentSchema | undefined;
  refetch: () => void;
}
const AcceptTransferBanner: React.FC<AcceptTransferBannerProps> = ({
  loggedInUser,
  document,
  refetch,
}) => {
  const target = document?.pending_transfer_user;
  const acceptDocument = useAcceptDocumentTransfer({
    mutation: {
      onSuccess: async ({ value: newDocument }) => {
        await navigate(
          `/user/${newDocument.author.username}/document/${newDocument.slug}`,
        );
        refetch();
      },
    },
  });
  const rejectDocument = useRejectDocumentTransfer({
    mutation: {
      onSuccess: () => {
        refetch();
      },
    },
  });
  const navigate = useNavigate();

  if (target == null || !loggedInUser?.loggedin || !document) return;

  // Different reasons to show the banner
  // Is the current user the target, are they an admin, or are they the current owner?
  // (These aren't mutually exclusive!)
  const showBecause = {
    targetUser: loggedInUser.userid === target.id,
    admin: loggedInUser.isCategoryAdmin || loggedInUser.isAdmin,
    documentOwner: loggedInUser.userid === document.author.id,
  };

  if (
    !showBecause.admin &&
    !showBecause.targetUser &&
    !showBecause.documentOwner
  )
    return;

  const onAccept = () => {
    acceptDocument.mutate({
      slug: document.slug,
    });
  };

  const onReject = () => {
    rejectDocument.mutate({
      slug: document.slug,
    });
  };

  const isSubmitting = acceptDocument.isPending || rejectDocument.isPending;

  const body = showBecause.documentOwner ? (
    <span>
      You are in the process of transferring this document to{" "}
      <UserRender user={target} />. They must accept the transfer before it is
      completed.
    </span>
  ) : showBecause.targetUser ? (
    <span>
      <UserRender user={document.author} /> wants to transfer this document to
      you.
    </span>
  ) : (
    <span>
      <UserRender user={document.author} /> wants to transfer this document to{" "}
      <UserRender user={target} />.
    </span>
  );

  return (
    <Alert
      color="gray"
      title="Transfer Pending"
      icon={<IconArrowBigRightLine />}
    >
      <Flex align="baseline" gap="md" justify="left">
        {body}

        {/* Only show accept button if user is the target (and not owner self, just in case) */}
        {showBecause.targetUser && !showBecause.documentOwner ? (
          <Button
            color="brand"
            variant="filled"
            size="compact-sm"
            type="button"
            onClick={() => {
              onAccept();
            }}
            disabled={isSubmitting}
            rightSection={<IconCheck />}
          >
            Accept
          </Button>
        ) : (
          showBecause.admin && (
            <Button
              color="red"
              variant="filled"
              size="compact-sm"
              type="button"
              onClick={() => {
                onAccept();
              }}
              disabled={isSubmitting}
              rightSection={<IconCheck />}
            >
              Accept as admin
            </Button>
          )
        )}
        <Button
          color="red"
          variant="subtle"
          size="compact-sm"
          type="button"
          onClick={() => {
            onReject();
          }}
          disabled={isSubmitting}
          rightSection={<IconX />}
        >
          {showBecause.documentOwner ? "Abort" : "Reject"}
        </Button>
      </Flex>
    </Alert>
  );
};

// Calculate tab to show based on state if user hasn't
// navigated to a tab yet
function resolveTab(
  storedTab: string | null | undefined,
  searchParams: string,
  document?: DocumentSchema,
): string | undefined {
  if (storedTab) return storedTab;

  if (!document) return undefined;

  // If ?comment=... in url and that is a valid comment
  // navigate to comments
  const sp = new URLSearchParams(searchParams);
  const commentId = sp.get("comment");
  if (
    commentId &&
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    document.comments!.some(item => String(item.oid) === commentId)
  ) {
    return "comments";
  }

  // Navigate to first file if it exists
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const files = document.files!;
  if (files.length > 0) {
    return String(files[0].oid);
  }

  return undefined;
}

const DocumentPage: React.FC = () => {
  const { slug } = useParams() as { slug: string };
  const {
    data: document,
    isSuccess,
    refetch,
    isError,
    error,
  } = useGetDocument(
    slug,
    {
      include_comments: true,
      include_files: true,
    },
    {
      query: {
        select({ value: document }) {
          return document;
        },
      },
    },
  );

  useQuickSearchFilter(
    isSuccess
      ? { slug: document.category, displayname: document.category_display_name }
      : undefined,
  );

  const { search: searchParams } = useLocation();

  const [tab, setTab] = useState<string | null>();
  const resolvedTab = resolveTab(tab, searchParams, document);

  const activeFile =
    resolvedTab && !Number.isNaN(Number(resolvedTab))
      ? getFile(document, Number(resolvedTab))
      : undefined;
  const Components = getComponents(activeFile);
  const [editing, { toggle: toggleEditing }] = useDisclosure();
  const [warningFiles, setWarningFiles] = useState<DocumentFileSchema[]>([]);
  const [
    showWarningModal,
    { open: openWarningModal, close: closeWarningModal },
  ] = useDisclosure();
  const [loadingDownload, startDownload] = useDocumentDownload(document);

  useScrollToPermalink();
  const user = useUser();

  const getFileExtension = (filename: string): string | undefined => {
    return filename.split(".").at(-1)?.toLowerCase();
  };

  function formatDisplayName(file: DocumentFileSchema): string {
    const ext = getFileExtension(file.filename);
    if (ext && file.display_name.endsWith(`.${ext}`)) {
      return file.display_name;
    }

    return `${file.display_name}.${ext}`;
  }

  const isUnsafeFile = (file: DocumentFileSchema): boolean => {
    const ext = getFileExtension(file.filename);
    return (
      ext !== undefined &&
      !serverData.document_download_safe_extensions.includes(ext)
    );
  };

  const handleDownload = () => {
    const warningFiles = document?.files?.filter(file => {
      return isUnsafeFile(file);
    });
    if (warningFiles && warningFiles.length > 0) {
      setWarningFiles(warningFiles);
      openWarningModal();
    } else {
      startDownload();
    }
  };

  return (
    <>
      <Modal
        opened={showWarningModal}
        onClose={closeWarningModal}
        withCloseButton={false}
      >
        <Stack>
          <Text>Some requested files have uncommon file extensions.</Text>
          <Text>
            Please note that the server has not scanned or verified the files
            for viruses, and you should exercise caution when downloading
            user-uploaded files.
          </Text>
          <Alert
            title={`Possibly unsafe file${warningFiles.length > 1 ? "s" : ""}`}
          >
            <List spacing={4} size="sm">
              {warningFiles.map(file => (
                <List.Item key={file.display_name}>
                  {formatDisplayName(file)}
                </List.Item>
              ))}
            </List>
          </Alert>
          <Text>Are you sure you want to continue?</Text>
          <Group justify="flex-end">
            <Button onClick={closeWarningModal}>Cancel</Button>
            <Button
              color="red"
              onClick={() => {
                startDownload();
                closeWarningModal();
              }}
            >
              Download
            </Button>
          </Group>
        </Stack>
      </Modal>
      <Container size="xl">
        <Breadcrumbs separator={<IconChevronRight />}>
          <Anchor tt="uppercase" size="xs" component={Link} to="/">
            Home
          </Anchor>
          <Anchor
            size="xs"
            tt="uppercase"
            component={Link}
            to={`/category/${document ? document.category : ""}`}
            style={{ wordBreak: "break-word", textWrap: "pretty" }}
          >
            {document?.category_display_name}
          </Anchor>
          <Anchor
            size="xs"
            tt="uppercase"
            style={{ wordBreak: "break-word", textWrap: "pretty" }}
          >
            {document?.display_name}
          </Anchor>
        </Breadcrumbs>
        {document && (
          <Box my="sm">
            <Flex justify="space-between" align="center">
              <Title>{document.display_name}</Title>
              <Group>
                <IconButton
                  icon={<IconDownload />}
                  onClick={handleDownload}
                  color="gray"
                  tooltip="Download"
                  loading={loadingDownload}
                />
                <LikeButton document={document} refetch={refetch} />
              </Group>
            </Flex>
            <Group gap={0}>
              <UserRender
                user={document.author}
                anonymised={document.anonymised}
                can_see_anonymised={document.can_edit || document.can_delete}
              />
              {document.edittime && (
                <>
                  <Text c="dimmed" mx={6} component="span">
                    ·
                  </Text>
                  <Tooltip
                    withArrow
                    withinPortal
                    label={
                      document.time &&
                      `Created ${formatDistanceToNow(new Date(document.time))} ago`
                    }
                    disabled={document.time === null}
                  >
                    <Text c="dimmed" component="span">
                      updated {formatDistanceToNow(new Date(document.edittime))}{" "}
                      ago
                    </Text>
                  </Tooltip>
                </>
              )}
            </Group>
          </Box>
        )}
        {isError && <Alert color="red">{String(error)}</Alert>}
        {document?.description && (
          <div>
            <MarkdownText value={document.description} />
          </div>
        )}
        <AcceptTransferBanner
          loggedInUser={user}
          document={document}
          refetch={refetch}
        />
      </Container>
      <Container size="xl" mt="sm">
        <Tabs value={resolvedTab} onChange={setTab}>
          <Tabs.List>
            {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
            {document
              ?.files!.sort((a, b) => a.order - b.order)
              .map(file => (
                <Tabs.Tab
                  key={file.oid}
                  value={file.oid.toString()}
                  leftSection={<FileIcon filename={file.filename} />}
                >
                  {formatDisplayName(file)}
                </Tabs.Tab>
              ))}
            <Tabs.Tab value="comments" leftSection={<IconMessage />}>
              Comments
            </Tabs.Tab>
            {document && (document.can_delete || document.can_edit) && (
              <Tabs.Tab value="settings" leftSection={<IconSettings />}>
                Settings
              </Tabs.Tab>
            )}
          </Tabs.List>
        </Tabs>
      </Container>

      {activeFile &&
        document &&
        (Components?.Viewer ? (
          document.can_edit && Components.Editor !== undefined ? (
            <ContentContainer mt="-2px">
              <Container>
                <Flex py="sm" justify="center">
                  <Button leftSection={<IconEdit />} onClick={toggleEditing}>
                    Toggle Edit Mode
                  </Button>
                </Flex>
              </Container>
              {!editing && (
                <Components.Viewer
                  file={activeFile}
                  document={document}
                  url={`/api/document/${slug}/file/${activeFile?.filename}`}
                />
              )}
              {editing && (
                <Container size="xl">
                  <Components.Editor
                    file={activeFile}
                    document={document}
                    url={`/api/document/${slug}/file/${activeFile?.filename}`}
                  />
                </Container>
              )}
            </ContentContainer>
          ) : (
            <Components.Viewer
              file={activeFile}
              document={document}
              url={`/api/document/${slug}/file/${activeFile?.filename}`}
            />
          )
        ) : (
          <ContentContainer mt="-2px">
            <Container size="xl">
              {activeFile &&
                (isUnsafeFile(activeFile) ? (
                  <Alert color="red" my="sm">
                    This file has an uncommon file extension. Be careful when
                    downloading it, as the server does not scan user-uploaded
                    files for viruses.
                  </Alert>
                ) : (
                  <Alert color="blue" my="sm">
                    This file can only be downloaded.
                  </Alert>
                ))}
              <Button
                leftSection={<IconDownload />}
                onClick={() =>
                  download(`/api/document/${slug}/file/${activeFile.filename}`)
                }
              >
                Download
              </Button>
            </Container>
          </ContentContainer>
        ))}
      {tab === "comments" && document && (
        <ContentContainer mt="-2px">
          <Container size="xl">
            {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
            {document.comments!.length === 0 && (
              <Alert mb="sm">There are no comments yet.</Alert>
            )}
            {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
            {document.comments!.map(comment => (
              <DocumentCommentComponent
                documentSlug={slug}
                comment={comment}
                key={comment.oid}
                refetch={refetch}
              />
            ))}
            <Card shadow="md" withBorder>
              <DocumentCommentForm documentSlug={slug} refetch={refetch} />
            </Card>
          </Container>
        </ContentContainer>
      )}

      {tab === "settings" && document && (
        <ContentContainer mt="-2px">
          <Container size="xl">
            <DocumentSettings document={document} refetch={refetch} />
          </Container>
        </ContentContainer>
      )}
    </>
  );
};

export default DocumentPage;
