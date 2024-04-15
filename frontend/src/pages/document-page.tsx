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
  Box,
  Tooltip,
} from "@mantine/core";
import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { download } from "../api/fetch-utils";
import { useDocument } from "../api/hooks";
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
import { Document, DocumentFile } from "../interfaces";
import MarkdownText from "../components/markdown-text";
import { differenceInSeconds, formatDistanceToNow } from "date-fns";
import { Tabs } from "@mantine/core";
import {
  IconChevronRight,
  IconDownload,
  IconEdit,
  IconFile,
  IconMessage,
  IconSettings,
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";

const isPdf = (file: DocumentFile) => file.mime_type === "application/pdf";
const isMarkdown = (file: DocumentFile) =>
  file.filename.endsWith(".md") &&
  (file.mime_type === "application/octet-stream" ||
    file.mime_type === "text/x-markdown" ||
    file.mime_type === "text/markdown");

const isTex = (file: DocumentFile) => file.mime_type === "application/x-tex";

const getComponents = (
  file: DocumentFile | undefined,
):
  | {
      Viewer: React.FC<{ document: Document; file: DocumentFile; url: string }>;
      Editor:
        | React.FC<{ document: Document; file: DocumentFile; url: string }>
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
  if (isTex(file)) {
    return { Viewer: DocumentCode, Editor: undefined };
  }

  return undefined;
};

const getFile = (document: Document | undefined, oid: number) =>
  document ? document.files.find(x => x.oid === oid) : undefined;

interface Props {}
const DocumentPage: React.FC<Props> = () => {
  const { author, slug } = useParams() as { slug: string; author: string };
  const [error, _, data, mutate] = useDocument(author, slug, document => {
    if (document.files.length > 0) setTab(document.files[0].oid.toString());
  });

  const [tab, setTab] = useState<string | null>("none");
  const activeFile = !Number.isNaN(Number(tab))
    ? getFile(data, Number(tab))
    : undefined;
  const Components = getComponents(activeFile);
  const [editing, {toggle: toggleEditing}] = useDisclosure();
  const [loadingDownload, startDownload] = useDocumentDownload(data);
  return (
    <>
      <Container size="xl">
        <Breadcrumbs separator={<IconChevronRight />}>
          <Anchor tt="uppercase" size="xs" component={Link} to="/">
            Home
          </Anchor>
          <Anchor
            size="xs"
            tt="uppercase"
            component={Link}
            to={`/category/${data ? data.category : ""}`}
          >
            {data && data.category_display_name}
          </Anchor>
          <Anchor size="xs" tt="uppercase">
            {data && data.display_name}
          </Anchor>
        </Breadcrumbs>
        {data && (
          <Box my="sm">
            <Flex justify="space-between" align="center">
              <Title>{data.display_name ?? slug}</Title>
              <Group>
                <IconButton
                  icon={<IconDownload />}
                  onClick={startDownload}
                  color="gray"
                  tooltip="Download"
                  loading={loadingDownload}
                />
                <LikeButton document={data} mutate={mutate} />
              </Group>
            </Flex>
            <Anchor component={Link} to={`/user/${data.author}`}>
              <Text fw={700} component="span">
                {data.author_displayname}
              </Text>
              <Text ml="0.3em" color="dimmed" component="span">
                @{data.author}
              </Text>
            </Anchor>
            {differenceInSeconds(new Date(data.edittime), new Date(data.time)) >
              1 && (
              <>
                <Text color="dimmed" mx={6} component="span">
                  ·
                </Text>
                <Tooltip
                  withArrow
                  withinPortal
                  label={`Created ${formatDistanceToNow(new Date(data.time))} ago`}
                  disabled={data.time === null}
                >
                  <Text color="dimmed" component="span">
                    updated {formatDistanceToNow(new Date(data.edittime))} ago
                  </Text>
                </Tooltip>
              </>
            )}
          </Box>
        )}
        {error && <Alert color="red">{error.toString()}</Alert>}
        {data && data.description && (
          <div>
            <MarkdownText value={data.description} />
          </div>
        )}
      </Container>
      <Container size="xl" mt="sm">
        <Tabs value={tab} onChange={setTab}>
          <Tabs.List>
            {data &&
              data.files.map(file => (
                <Tabs.Tab
                  key={file.oid}
                  value={file.oid.toString()}
                  leftSection={<IconFile />}
                >
                  {file.display_name}
                </Tabs.Tab>
              ))}
            <Tabs.Tab value="comments" leftSection={<IconMessage />}>
              Comments
            </Tabs.Tab>
            {data && (data.can_delete || data.can_edit) && (
              <Tabs.Tab value="settings" leftSection={<IconSettings />}>
                Settings
              </Tabs.Tab>
            )}
          </Tabs.List>
        </Tabs>
      </Container>

      {!Number.isNaN(Number(tab)) &&
        data &&
        (Components?.Viewer ? (
          data.can_edit && Components.Editor !== undefined ? (
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
                  file={activeFile!}
                  document={data}
                  url={`/api/document/file/${activeFile?.filename}`}
                />
              )}
              {editing && (
                <Container size="xl">
                  <Components.Editor
                    file={activeFile!}
                    document={data}
                    url={`/api/document/file/${activeFile?.filename}`}
                  />
                </Container>
              )}
            </ContentContainer>
          ) : (
            <Components.Viewer
              file={activeFile!}
              document={data}
              url={`/api/document/file/${activeFile?.filename}`}
            />
          )
        ) : (
          <ContentContainer mt="-2px">
            <Container size="xl">
              <Alert color="blue" my="sm">
                This file can only be downloaded.
              </Alert>
              <Button
                leftSection={<IconDownload />}
                onClick={() =>
                  download(`/api/document/file/${activeFile?.filename}`)
                }
              >
                Download
              </Button>
            </Container>
          </ContentContainer>
        ))}
      {tab === "comments" && data && (
        <ContentContainer mt="-2px">
          <Container size="xl">
            {data.comments.length === 0 && (
              <Alert mb="sm">There are no comments yet.</Alert>
            )}
            {data.comments.map(comment => (
              <DocumentCommentComponent
                documentAuthor={data.author}
                documentSlug={slug}
                comment={comment}
                key={comment.oid}
                mutate={mutate}
              />
            ))}
            <Card shadow="md" withBorder>
              <DocumentCommentForm
                documentAuthor={author}
                documentSlug={slug}
                mutate={mutate}
              />
            </Card>
          </Container>
        </ContentContainer>
      )}

      {tab === "settings" && data && (
        <ContentContainer mt="-2px">
          <Container size="xl">
            <DocumentSettings data={data} mutate={mutate} />
          </Container>
        </ContentContainer>
      )}
    </>
  );
};

export default DocumentPage;
