import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Card,
  Container,
  Icon,
  ICONS,
  InputField,
  Nav,
  NavItem,
  NavLink,
} from "@vseth/components";
import { SSL_OP_TLS_ROLLBACK_BUG } from "constants";
import React, { useState } from "react";
import { Link, useHistory, useParams } from "react-router-dom";
import { download } from "../api/fetch-utils";
import { useDeleteSummary, useSummary } from "../api/hooks";
import { useUser } from "../auth";
import FileInput from "../components/file-input";
import IconButton from "../components/icon-button";
import ContentContainer from "../components/secondary-container";
import SmallButton from "../components/small-button";
import SummaryCommentForm from "../components/summary-comment-form";
import SummaryMarkdown from "../components/summary-markdown";
import SummaryMarkdownEditor from "../components/summary-markdown-editor";
import SummaryPdf from "../components/summary-pdf";
import SummarySettings from "../components/summary-settings";
import { Summary } from "../interfaces";
import SummaryCommentComponent from "../components/summary-comment";

const isPdf = (summary: Summary) => summary.mime_type === "application/pdf";
const isMarkdown = (summary: Summary) =>
  summary.mime_type === "application/octet-stream" &&
  summary.filename.endsWith(".md");

const getComponents = (
  summary: Summary | undefined,
):
  | {
      Viewer: React.FC<{ summary: Summary; url: string }>;
      Editor: React.FC<{ summary: Summary; url: string }> | undefined;
    }
  | undefined => {
  if (summary === undefined) return undefined;

  if (isPdf(summary)) {
    return { Viewer: SummaryPdf, Editor: undefined };
  }
  if (isMarkdown(summary)) {
    return { Viewer: SummaryMarkdown, Editor: SummaryMarkdownEditor };
  }

  return undefined;
};

enum SummaryTab {
  SUMMARY,
  COMMENTS,
  EDIT,
  SETTINGS,
}

interface Props {}
const SummaryPage: React.FC<Props> = () => {
  const { slug } = useParams() as { slug: string };
  const [error, loading, data, mutate] = useSummary(slug);

  const [tab, setTab] = useState<SummaryTab>(SummaryTab.SUMMARY);
  const Components = getComponents(data);
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
        <div className="d-flex justify-content-between">
          <h1>{data?.display_name ?? slug}</h1>
          <div>
            <IconButton
              icon="LIKE_FILLED"
              color="danger"
              className="mr-1"
              onClick={() =>
                data && download(`/api/summary/file/${data?.filename}`)
              }
            />
            <IconButton
              icon="DOWNLOAD"
              onClick={() =>
                data && download(`/api/summary/file/${data?.filename}`)
              }
            />
          </div>
        </div>
        Author:{" "}
        {data && <Link to={`/user/${data.author}`}>@{data.author}</Link>}
      </Container>
      <Nav tabs className="mt-4">
        <Container className="d-flex">
          <NavItem>
            <NavLink
              onClick={() => setTab(SummaryTab.SUMMARY)}
              active={tab === SummaryTab.SUMMARY}
            >
              Summary
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              onClick={() => setTab(SummaryTab.COMMENTS)}
              active={tab === SummaryTab.COMMENTS}
            >
              Comments
            </NavLink>
          </NavItem>
          {Components?.Editor !== undefined && (
            <NavItem>
              <NavLink
                onClick={() => setTab(SummaryTab.EDIT)}
                active={tab === SummaryTab.EDIT}
              >
                Edit
              </NavLink>
            </NavItem>
          )}
          <NavItem>
            <NavLink
              onClick={() => setTab(SummaryTab.SETTINGS)}
              active={tab === SummaryTab.SETTINGS}
            >
              Settings
            </NavLink>
          </NavItem>
        </Container>
      </Nav>

      {tab === SummaryTab.SUMMARY &&
        data &&
        (Components?.Viewer ? (
          <Components.Viewer
            summary={data}
            url={`/api/summary/file/${data.filename}`}
          />
        ) : (
          <div className="py-4 text-center text-large">
            This summary can only be downloaded.
          </div>
        ))}
      {tab === SummaryTab.COMMENTS && data && (
        <ContentContainer>
          <Container>
            {data.comments.length === 0 && (
              <div className="py-4 text-center">There are no comments yet.</div>
            )}
            {data.comments.map(comment => (
              <SummaryCommentComponent
                comment={comment}
                summarySlug={slug}
                key={comment.oid}
                mutate={mutate}
              />
            ))}
            <Card className="p-2">
              <SummaryCommentForm summarySlug={slug} mutate={mutate} />
            </Card>
          </Container>
        </ContentContainer>
      )}
      {tab === SummaryTab.EDIT && data && Components?.Editor && (
        <ContentContainer>
          <Container>
            <Components.Editor
              summary={data}
              url={`/api/summary/file/${data.filename}`}
            />
          </Container>
        </ContentContainer>
      )}
      {tab === SummaryTab.SETTINGS && data && (
        <ContentContainer>
          <Container>
            <SummarySettings data={data} slug={slug} />
          </Container>
        </ContentContainer>
      )}
    </>
  );
};

export default SummaryPage;
