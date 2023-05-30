import {
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Card,
  Col,
  Container,
  DownloadIcon,
  EditIcon,
  FileIcon,
  Nav,
  NavItem,
  NavLink,
  Row,
} from "@vseth/components";
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
import useToggle from "../hooks/useToggle";
import { Document, DocumentFile } from "../interfaces";
import MarkdownText from "../components/markdown-text";

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

enum DocumentTab {
  NONE = "NONE",
  COMMENTS = "COMMENTS",
  SETTINGS = "SETTINGS",
}

const getFile = (document: Document | undefined, oid: number) =>
  document ? document.files.find(x => x.oid === oid) : undefined;

interface Props { }
const DocumentPage: React.FC<Props> = () => {
  const { author, slug } = useParams() as { slug: string; author: string };
  const [error, _, data, mutate] = useDocument(author, slug, document => {
    if (document.files.length > 0) setTab(document.files[0].oid);
  });

  const [tab, setTab] = useState<DocumentTab | number>(DocumentTab.NONE);
  const activeFile = typeof tab === "number" ? getFile(data, tab) : undefined;
  const Components = getComponents(activeFile);
  const [editing, toggleEditing] = useToggle();
  const [loadingDownload, startDownload] = useDocumentDownload(data);
  return (
    <>
      <Container>
        <Breadcrumb>
          <BreadcrumbItem>
            <Link className="text-primary" to="/">
              Home
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Link
              className="text-primary"
              to={`/category/${data ? data.category : ""}`}
            >
              {data && data.category_display_name}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem>{data && data.display_name}</BreadcrumbItem>
        </Breadcrumb>
        {data && (
          <div className="d-flex justify-content-between align-items-center">
            <h1>{data.display_name ?? slug}</h1>
            <div>
              <IconButton
                icon={DownloadIcon}
                onClick={startDownload}
                color="white"
                loading={loadingDownload}
              />

              <LikeButton document={data} mutate={mutate} />
            </div>
          </div>
        )}
        <div>
          Author:{" "}
          {data && (
            <Link className="text-primary" to={`/user/${data.author}`}>
              @{data.author}
            </Link>
          )}
        </div>
        {error && <Alert color="danger">{error.toString()}</Alert>}
        {data && data.description && (
          <div>
            <MarkdownText value={data.description} />
          </div>
        )}
      </Container>
      <Nav tabs className="mt-4">
        <Container>
          <Row className="d-flex flex-wrap">
            {data &&
              data.files.map(file => (
                <Col key={file.oid} xs="auto">
                  <NavItem className="m-0">
                    <NavLink
                      onClick={() => setTab(file.oid)}
                      active={tab === file.oid}
                    >
                      <span className="text-small">
                        <FileIcon className="mr-2 text-small" />
                      </span>
                      {file.display_name}
                    </NavLink>
                  </NavItem>
                </Col>
              ))}
            <Col xs="auto">
              <NavItem className="m-0">
                <NavLink
                  onClick={() => setTab(DocumentTab.COMMENTS)}
                  active={tab === DocumentTab.COMMENTS}
                >
                  Comments
                </NavLink>
              </NavItem>
            </Col>

            {data && (data.can_delete || data.can_edit) && (
              <Col xs="auto">
                <NavItem className="m-0">
                  <NavLink
                    onClick={() => setTab(DocumentTab.SETTINGS)}
                    active={tab === DocumentTab.SETTINGS}
                  >
                    Settings
                  </NavLink>
                </NavItem>
              </Col>
            )}
          </Row>
        </Container>
      </Nav>

      {typeof tab === "number" &&
        data &&
        (Components?.Viewer ? (
          data.can_edit && Components.Editor !== undefined ? (
            <>
              <Container className="py-3">
                <div className="form-group d-flex justify-content-end">
                  <Button onClick={toggleEditing}>
                    <EditIcon className="mr-2" /> Toggle Edit Mode
                  </Button>
                </div>
              </Container>
              {!editing && (
                <Components.Viewer
                  file={activeFile!}
                  document={data}
                  url={`/api/document/file/${activeFile?.filename}`}
                />
              )}
              {editing && (
                <Container>
                  <Components.Editor
                    file={activeFile!}
                    document={data}
                    url={`/api/document/file/${activeFile?.filename}`}
                  />
                </Container>
              )}
            </>
          ) : (
            <Components.Viewer
              file={activeFile!}
              document={data}
              url={`/api/document/file/${activeFile?.filename}`}
            />
          )
        ) : (
          <Container>
            <div className="w-100 py-4 px-1 d-flex justify-content-center align-items-center flex-wrap">
              <Alert color="info" className="m-2">
                This file can only be downloaded.
              </Alert>
              <Button
                className="m-2"
                onClick={() =>
                  download(`/api/document/file/${activeFile?.filename}`)
                }
              >
                <DownloadIcon className="mr-2" />
                Download
              </Button>
            </div>
          </Container>
        ))}
      {tab === DocumentTab.COMMENTS && data && (
        <ContentContainer>
          <Container>
            {data.comments.length === 0 && (
              <div className="py-4 text-center">There are no comments yet.</div>
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
            <Card className="p-2">
              <DocumentCommentForm
                documentAuthor={author}
                documentSlug={slug}
                mutate={mutate}
              />
            </Card>
          </Container>
        </ContentContainer>
      )}

      {tab === DocumentTab.SETTINGS && data && (
        <ContentContainer>
          <Container>
            <DocumentSettings data={data} mutate={mutate} />
          </Container>
        </ContentContainer>
      )}
    </>
  );
};

export default DocumentPage;
