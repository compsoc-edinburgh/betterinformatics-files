import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Card,
  Container,
  InputField,
  Nav,
  NavItem,
  NavLink,
} from "@vseth/components";
import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { download } from "../api/fetch-utils";
import { useSummary } from "../api/hooks";
import FileInput from "../components/file-input";
import IconButton from "../components/icon-button";
import ContentContainer from "../components/secondary-container";
import SummaryCommentForm from "../components/summary-comment-form";
import SummaryMarkdown from "../components/summary-markdown";
import SummaryMarkdownEditor from "../components/summary-markdown-editor";
import SummaryPdf from "../components/summary-pdf";
import { Summary } from "../interfaces";

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
  const [error, loading, data] = useSummary(slug);
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
          <IconButton
            icon="DOWNLOAD"
            onClick={() =>
              data &&
              download(
                `http://localhost:8081/api/summary/file/${data?.filename}`,
              )
            }
          />
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
      <ContentContainer>
        <Container>
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
          {tab === SummaryTab.COMMENTS && (
            <>
              <div className="py-4 text-center">There are no comments yet.</div>
              <Card className="p-2">
                <SummaryCommentForm />
              </Card>
            </>
          )}
          {tab === SummaryTab.EDIT && data && Components?.Editor && (
            <Components.Editor
              summary={data}
              url={`/api/summary/file/${data.filename}`}
            />
          )}
          {tab === SummaryTab.SETTINGS && (
            <>
              <InputField label="Display Name" value={data?.display_name} />
              <FileInput onChange={() => void 0} />
              <h3 className="mt-5 mb-4">Danger Zone</h3>
              <div className="d-flex flex-wrap justify-content-between align-items-center">
                <div className="d-flex flex-column">
                  <h6>Delete this summary</h6>
                  <div>
                    Deleting the summary will delete the associated file and all
                    comments. This cannot be undone.
                  </div>
                </div>

                <Button color="danger" onClick={() => console.log("Ello")}>
                  Delete
                </Button>
              </div>
            </>
          )}
        </Container>
      </ContentContainer>
    </>
  );
};

export default SummaryPage;
