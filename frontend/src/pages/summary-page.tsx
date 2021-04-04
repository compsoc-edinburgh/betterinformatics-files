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
import { useSummary } from "../api/hooks";
import IconButton from "../components/icon-button";
import LikeButton from "../components/like-button";
import ContentContainer from "../components/secondary-container";
import SummaryCode from "../components/summary-code";
import SummaryCommentComponent from "../components/summary-comment";
import SummaryCommentForm from "../components/summary-comment-form";
import SummaryMarkdown from "../components/summary-markdown";
import SummaryMarkdownEditor from "../components/summary-markdown-editor";
import SummaryPdf from "../components/summary-pdf";
import SummarySettings from "../components/summary-settings";
import { useSummaryDownload } from "../hooks/useSummaryDownload";
import useToggle from "../hooks/useToggle";
import { Summary, SummaryFile } from "../interfaces";

const isPdf = (file: SummaryFile) => file.mime_type === "application/pdf";
const isMarkdown = (file: SummaryFile) =>
  file.mime_type === "application/octet-stream" &&
  file.filename.endsWith(".md");
const isTex = (file: SummaryFile) => file.mime_type === "application/x-tex";

const getComponents = (
  file: SummaryFile | undefined,
):
  | {
      Viewer: React.FC<{ summary: Summary; file: SummaryFile; url: string }>;
      Editor:
        | React.FC<{ summary: Summary; file: SummaryFile; url: string }>
        | undefined;
    }
  | undefined => {
  if (file === undefined) return undefined;

  if (isPdf(file)) {
    return { Viewer: SummaryPdf, Editor: undefined };
  }
  if (isMarkdown(file)) {
    return { Viewer: SummaryMarkdown, Editor: SummaryMarkdownEditor };
  }
  if (isTex(file)) {
    return { Viewer: SummaryCode, Editor: undefined };
  }

  return undefined;
};

enum SummaryTab {
  NONE = "NONE",
  COMMENTS = "COMMENTS",
  SETTINGS = "SETTINGS",
}

const getFile = (summary: Summary | undefined, oid: number) =>
  summary ? summary.files.find(x => x.oid === oid) : undefined;

interface Props {}
const SummaryPage: React.FC<Props> = () => {
  const { author, slug } = useParams() as { slug: string; author: string };
  const [error, loading, data, mutate] = useSummary(author, slug, summary => {
    if (summary.files.length > 0) setTab(summary.files[0].oid);
  });

  const [tab, setTab] = useState<SummaryTab | number>(SummaryTab.NONE);
  const activeFile = typeof tab === "number" ? getFile(data, tab) : undefined;
  const Components = getComponents(activeFile);
  const [editing, toggleEditing] = useToggle();
  const [loadingDownload, startDownload] = useSummaryDownload(data);
  return (
    <>
      <Container>
        <Breadcrumb>
          <BreadcrumbItem>
            <Link to="/">Home</Link>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Link to={`/category/${data ? data.category : ""}`}>
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
                icon="DOWNLOAD"
                onClick={startDownload}
                color="white"
                loading={loadingDownload}
              />

              <LikeButton summary={data} mutate={mutate} />
            </div>
          </div>
        )}
        <div>
          Author:{" "}
          {data && <Link to={`/user/${data.author}`}>@{data.author}</Link>}
        </div>
        {error && <Alert color="danger">{error.toString()}</Alert>}
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
                  onClick={() => setTab(SummaryTab.COMMENTS)}
                  active={tab === SummaryTab.COMMENTS}
                >
                  Comments
                </NavLink>
              </NavItem>
            </Col>

            {data && (data.can_delete || data.can_edit) && (
              <Col xs="auto">
                <NavItem className="m-0">
                  <NavLink
                    onClick={() => setTab(SummaryTab.SETTINGS)}
                    active={tab === SummaryTab.SETTINGS}
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
                  summary={data}
                  url={`/api/summary/file/${activeFile?.filename}`}
                />
              )}
              {editing && (
                <Container>
                  <Components.Editor
                    file={activeFile!}
                    summary={data}
                    url={`/api/summary/file/${activeFile?.filename}`}
                  />
                </Container>
              )}
            </>
          ) : (
            <Components.Viewer
              file={activeFile!}
              summary={data}
              url={`/api/summary/file/${activeFile?.filename}`}
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
                  download(`/api/summary/file/${activeFile?.filename}`)
                }
              >
                <DownloadIcon className="mr-2" />
                Download
              </Button>
            </div>
          </Container>
        ))}
      {tab === SummaryTab.COMMENTS && data && (
        <ContentContainer>
          <Container>
            {data.comments.length === 0 && (
              <div className="py-4 text-center">There are no comments yet.</div>
            )}
            {data.comments.map(comment => (
              <SummaryCommentComponent
                summaryAuthor={data.author}
                summarySlug={slug}
                comment={comment}
                key={comment.oid}
                mutate={mutate}
              />
            ))}
            <Card className="p-2">
              <SummaryCommentForm
                summaryAuthor={author}
                summarySlug={slug}
                mutate={mutate}
              />
            </Card>
          </Container>
        </ContentContainer>
      )}

      {tab === SummaryTab.SETTINGS && data && (
        <ContentContainer>
          <Container>
            <SummarySettings data={data} slug={slug} mutate={mutate} />
          </Container>
        </ContentContainer>
      )}
    </>
  );
};

export default SummaryPage;
