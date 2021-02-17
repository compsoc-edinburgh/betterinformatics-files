import { useRequest } from "@umijs/hooks";
import {
  Alert,
  Badge,
  Breadcrumb,
  Col,
  Container,
  ListGroup,
  Row,
  Spinner,
  ListGroupItem,
} from "@vseth/components";
import { BreadcrumbItem } from "@vseth/components/dist/components/Breadcrumb/Breadcrumb";
import React, { useCallback, useMemo, useState } from "react";
import { Link, useParams, useHistory } from "react-router-dom";
import {
  loadCategoryMetaData,
  loadMetaCategories,
  useRemoveCategory,
} from "../api/hooks";
import { UserContext, useUser } from "../auth";
import CategoryMetaDataEditor from "../components/category-metadata-editor";
import ExamList from "../components/exam-list";
import IconButton from "../components/icon-button";
import LoadingOverlay from "../components/loading-overlay";
import { CategoryMetaData } from "../interfaces";
import { getMetaCategoriesForCategory } from "../utils/category-utils";
import useTitle from "../hooks/useTitle";
import useConfirm from "../hooks/useConfirm";
import { css } from "emotion";

const metadataColStyle = css``;

interface CategoryPageContentProps {
  onMetaDataChange: (newMetaData: CategoryMetaData) => void;
  metaData: CategoryMetaData;
}
const CategoryPageContent: React.FC<CategoryPageContentProps> = ({
  onMetaDataChange,
  metaData,
}) => {
  const { data, loading, run } = useRequest(loadMetaCategories, {
    cacheKey: "meta-categories",
  });
  const history = useHistory();
  const [removeLoading, remove] = useRemoveCategory(() => history.push("/"));
  const [confirm, modals] = useConfirm();
  const onRemove = useCallback(
    () =>
      confirm(
        `Do you really want to remove the category "${metaData.displayname}"?`,
        () => remove(metaData.slug),
      ),
    [confirm, remove, metaData],
  );
  const offeredIn = useMemo(
    () =>
      data ? getMetaCategoriesForCategory(data, metaData.slug) : undefined,
    [data, metaData],
  );
  const [editing, setEditing] = useState(false);
  const toggle = useCallback(() => setEditing(a => !a), []);
  const user = useUser()!;
  const editorOnMetaDataChange = useCallback(
    (newMetaData: CategoryMetaData) => {
      onMetaDataChange(newMetaData);
      run();
    },
    [run, onMetaDataChange],
  );
  return (
    <>
      {modals}
      <Breadcrumb>
        <BreadcrumbItem>
          <Link to="/">Home</Link>
        </BreadcrumbItem>
        <BreadcrumbItem>{metaData.displayname}</BreadcrumbItem>
      </Breadcrumb>
      {editing ? (
        offeredIn && (
          <CategoryMetaDataEditor
            onMetaDataChange={editorOnMetaDataChange}
            isOpen={editing}
            toggle={toggle}
            currentMetaData={metaData}
            offeredIn={offeredIn.flatMap(b =>
              b.meta2.map(d => [b.displayname, d.displayname] as const),
            )}
          />
        )
      ) : (
        <>
          <Row>
            <Col>
              <h1 className="mb-3">{metaData.displayname}</h1>
            </Col>
            {user.isCategoryAdmin && (
              <Col md="auto" className="d-flex align-items-center">
                <IconButton
                  size="sm"
                  className="m-1"
                  icon="EDIT"
                  onClick={() => setEditing(true)}
                >
                  Edit
                </IconButton>
                <IconButton
                  color="danger"
                  size="sm"
                  className="m-1"
                  loading={removeLoading}
                  icon="DELETE"
                  onClick={onRemove}
                >
                  Delete
                </IconButton>
              </Col>
            )}
          </Row>

          <Row className="my-2">
            {metaData.semester && (
              <Col className={metadataColStyle} md="auto">
                Semester: <Badge>{metaData.semester}</Badge>
              </Col>
            )}
            {metaData.form && (
              <Col className={metadataColStyle} md="auto">
                Form: <Badge>{metaData.form}</Badge>
              </Col>
            )}
            {metaData.more_exams_link && (
              <Col className={metadataColStyle} md="auto">
                <a
                  href={metaData.more_exams_link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Additional Exams
                </a>
              </Col>
            )}
            {metaData.remark && (
              <Col className={metadataColStyle} md="auto">
                Remark: {metaData.remark}
              </Col>
            )}
          </Row>
          {(offeredIn === undefined || offeredIn.length > 0) && (
            <div>
              Offered in:
              <div>
                {loading ? (
                  <Spinner />
                ) : (
                  <ul>
                    {offeredIn?.map(meta1 =>
                      meta1.meta2.map(meta2 => (
                        <li key={meta1.displayname + meta2.displayname}>
                          {meta2.displayname} in {meta1.displayname}
                        </li>
                      )),
                    )}
                  </ul>
                )}
              </div>
            </div>
          )}
          <Row className="my-2">
            {metaData.experts.includes(user.username) && (
              <Col>
                <Alert>
                  You are an expert for this category. You can endorse correct
                  answers.
                </Alert>
              </Col>
            )}
            {metaData.has_payments && (
              <Col>
                <Alert>
                  You have to pay a deposit of 20 CHF in the VIS bureau in order
                  to see oral exams.
                  <br />
                  After submitting a report of your own oral exam you can get
                  your deposit back.
                </Alert>
              </Col>
            )}
            {metaData.catadmin && (
              <Col>
                <Alert color="info">
                  You can edit exams in this category. Please do so responsibly.
                </Alert>
              </Col>
            )}
          </Row>

          <ExamList metaData={metaData} />
          <Col lg={12}>
            {metaData.attachments.length > 0 && (
              <>
                <h2>Attachments</h2>
                <ListGroup flush>
                  {metaData.attachments.map(att => (
                    <a
                      href={`/api/filestore/get/${att.filename}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      key={att.filename}
                    >
                      <div>{att.displayname}</div>
                    </a>
                  ))}
                </ListGroup>
              </>
            )}
          </Col>
        </>
      )}
    </>
  );
};

const CategoryPage: React.FC<{}> = () => {
  const { slug } = useParams() as { slug: string };
  const { data, loading, error, mutate } = useRequest(
    () => loadCategoryMetaData(slug),
    { cacheKey: `category-${slug}` },
  );
  useTitle(`${data?.displayname ?? slug} - VIS Community Solutions`);
  const user = useUser();
  return (
    <Container>
      {error && <Alert color="danger">{error.message}</Alert>}
      {data === undefined && <LoadingOverlay loading={loading} />}
      {data && (
        <UserContext.Provider
          value={
            user
              ? {
                  ...user,
                  isCategoryAdmin: user.isAdmin || data.catadmin,
                }
              : undefined
          }
        >
          <CategoryPageContent metaData={data} onMetaDataChange={mutate} />
        </UserContext.Provider>
      )}
    </Container>
  );
};
export default CategoryPage;
