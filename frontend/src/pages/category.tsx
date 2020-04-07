import { useRequest } from "@umijs/hooks";
import {
  Alert,
  Badge,
  Breadcrumb,
  Container,
  ListGroup,
  ListGroupItem,
  Spinner,
} from "@vseth/components";
import { BreadcrumbItem } from "@vseth/components/dist/components/Breadcrumb/Breadcrumb";
import React, { useCallback, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { loadCategoryMetaData, loadMetaCategories } from "../api/hooks";
import { UserContext, useUser } from "../auth";
import CategoryMetaDataEditor from "../components/category-metadata-editor";
import ExamList from "../components/exam-list";
import IconButton from "../components/icon-button";
import LoadingOverlay from "../components/loading-overlay";
import { CategoryMetaData } from "../interfaces";
import { getMetaCategoriesForCategory } from "../utils/category-utils";

interface CategoryPageContentProps {
  onMetaDataChange: (newMetaData: CategoryMetaData) => void;
  metaData: CategoryMetaData;
}
const CategoryPageContent: React.FC<CategoryPageContentProps> = ({
  onMetaDataChange,
  metaData,
}) => {
  const { data, loading } = useRequest(loadMetaCategories, {
    cacheKey: "meta-categories",
  });
  const offeredIn = useMemo(
    () =>
      data ? getMetaCategoriesForCategory(data, metaData.slug) : undefined,
    [data, metaData],
  );
  const [editing, setEditing] = useState(false);
  const toggle = useCallback(() => setEditing(a => !a), []);
  const user = useUser()!;
  return (
    <>
      <Breadcrumb>
        <BreadcrumbItem>
          <Link to="/">Home</Link>
        </BreadcrumbItem>
        <BreadcrumbItem>{metaData.displayname}</BreadcrumbItem>
      </Breadcrumb>
      {editing ? (
        offeredIn && (
          <CategoryMetaDataEditor
            onMetaDataChange={onMetaDataChange}
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
          {user.isCategoryAdmin && (
            <IconButton close icon="EDIT" onClick={() => setEditing(true)} />
          )}
          <h1>{metaData.displayname}</h1>
          <ListGroup className="m-2">
            {metaData.semester && (
              <ListGroupItem>
                Semester: <Badge>{metaData.semester}</Badge>
              </ListGroupItem>
            )}
            {metaData.form && (
              <ListGroupItem>
                Form: <Badge>{metaData.form}</Badge>
              </ListGroupItem>
            )}
            {(offeredIn === undefined || offeredIn.length > 0) && (
              <ListGroupItem>
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
              </ListGroupItem>
            )}
            {metaData.more_exams_link && (
              <ListGroupItem>
                <a
                  href={metaData.more_exams_link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Additional Exams
                </a>
              </ListGroupItem>
            )}
            {metaData.remark && (
              <ListGroupItem>Remark: {metaData.remark}</ListGroupItem>
            )}
            {metaData.experts.includes(user.username) && (
              <ListGroupItem>
                You are an expert for this category. You can endorse correct
                answers.
              </ListGroupItem>
            )}
            {metaData.has_payments && (
              <ListGroupItem>
                You have to pay a deposit of 20 CHF in the VIS bureau in order
                to see oral exams.
                <br />
                After submitting a report of your own oral exam you can get your
                deposit back.
              </ListGroupItem>
            )}
            {metaData.catadmin && (
              <ListGroupItem>
                You can edit exams in this category. Please do so responsibly.
              </ListGroupItem>
            )}
          </ListGroup>
          <ExamList metaData={metaData} />
          {metaData.attachments.length > 0 && (
            <>
              <h2>Attachments</h2>
              <ListGroup flush>
                {metaData.attachments.map(att => (
                  <a
                    href={"/api/filestore/get/" + att.filename + "/"}
                    target="_blank"
                    rel="noopener noreferrer"
                    key={att.filename}
                  >
                    <ListGroupItem>{att.displayname}</ListGroupItem>
                  </a>
                ))}
              </ListGroup>
            </>
          )}
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
                  isCategoryAdmin: user.isCategoryAdmin || data.catadmin,
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
