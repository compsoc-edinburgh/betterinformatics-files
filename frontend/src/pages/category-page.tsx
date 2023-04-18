import { useRequest } from "@umijs/hooks";
import {
  Breadcrumbs,
  Alert,
  Badge,
  Container,
  Anchor,
  Flex,
  Group,
  Grid,
  List,
  Button,
} from "@mantine/core";
import React, { useCallback, useMemo, useState } from "react";
import { Link, useHistory, useParams } from "react-router-dom";
import {
  loadCategoryMetaData,
  loadMetaCategories,
  useRemoveCategory,
} from "../api/hooks";
import { UserContext, useUser } from "../auth";
import CategoryMetaDataEditor from "../components/category-metadata-editor";
import ExamList from "../components/exam-list";
import LoadingOverlay from "../components/loading-overlay";
import DocumentList from "../components/document-list";
import useConfirm from "../hooks/useConfirm";
import useTitle from "../hooks/useTitle";
import { CategoryMetaData } from "../interfaces";
import { getMetaCategoriesForCategory } from "../utils/category-utils";
import serverData from "../utils/server-data";
import { Loader } from "@mantine/core";
import { Icon, ICONS } from "vseth-canine-ui";

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
      <Breadcrumbs separator="›">
        <Anchor
          tt="uppercase"
          size="xs"
          component={Link}
          className="text-primary"
          to="/"
        >
          Home
        </Anchor>
        <Anchor
          tt="uppercase"
          size="xs"
        >
          {metaData.displayname}
        </Anchor>
      </Breadcrumbs>
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
          <Flex direction="row" justify="space-between">
            <h1>{metaData.displayname}</h1>
            {user.isCategoryAdmin && (
              <Group>
                <Button
                  leftIcon={<Icon color="currentColor" icon={ICONS.EDIT} />}
                  onClick={() => setEditing(true)}
                >
                  Edit
                </Button>
                <Button
                  color="red"
                  loading={removeLoading}
                  leftIcon={<Icon color="currentColor" icon={ICONS.DELETE} />}
                  onClick={onRemove}
                >
                  Delete
                </Button>
              </Group>
            )}
          </Flex>

          <Grid className="my-2">
            {metaData.semester && (
              <Grid.Col span="content">
                Semester: <Badge>{metaData.semester}</Badge>
              </Grid.Col>
            )}
            {metaData.form && (
              <Grid.Col span="content">
                Form: <Badge>{metaData.form}</Badge>
              </Grid.Col>
            )}
            {metaData.more_exams_link && (
              <Grid.Col span="content">
                <a
                  href={metaData.more_exams_link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Additional Exams
                </a>
              </Grid.Col>
            )}
            {metaData.remark && (
              <Grid.Col md="content">Remark: {metaData.remark}</Grid.Col>
            )}
          </Grid>
          {(offeredIn === undefined || offeredIn.length > 0) && (
            <div>
              Offered in:
              <div>
                {loading ? (
                  <Loader />
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
          <Grid className="my-2">
            {metaData.experts.includes(user.username) && (
              <Grid.Col span="auto">
                <Alert>
                  You are an expert for this category. You can endorse correct
                  answers.
                </Alert>
              </Grid.Col>
            )}
            {metaData.has_payments && (
              <Grid.Col span="auto">
                <Alert bg="gray.2">
                  You have to pay a deposit in order to see oral exams.
                  {serverData.unlock_deposit_notice ? (
                    <>
                      <br />
                      {serverData.unlock_deposit_notice}
                    </>
                  ) : null}
                  <br />
                  After submitting a report of your own oral exam you can get
                  your deposit back.
                </Alert>
              </Grid.Col>
            )}
            {metaData.catadmin && (
              <Grid.Col span="auto">
                <Alert bg="gray.2">
                  You can edit exams in this category. Please do so responsibly.
                </Alert>
              </Grid.Col>
            )}
          </Grid>
          <ExamList metaData={metaData} />

          <h2 className="mb-3 mt-5">Documents</h2>
          <DocumentList slug={metaData.slug} />

          {metaData.attachments.length > 0 && (
            <>
              <h2 className="mb-3 mt-5">Attachments</h2>
              <List>
                {metaData.attachments.map(att => (
                  <List.Item>
                    <a
                      href={`/api/filestore/get/${att.filename}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      key={att.filename}
                    >
                      <div>{att.displayname}</div>
                    </a>
                  </List.Item>
                ))}
              </List>
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
  const history = useHistory();
  const onMetaDataChange = useCallback(
    (newMetaData: CategoryMetaData) => {
      mutate(newMetaData);
      if (slug !== newMetaData.slug) {
        history.push(`/category/${newMetaData.slug}`);
      }
    },
    [mutate, history, slug],
  );
  useTitle(data?.displayname ?? slug);
  const user = useUser();
  return (
    <Container size="xl">
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
          <CategoryPageContent
            metaData={data}
            onMetaDataChange={onMetaDataChange}
          />
        </UserContext.Provider>
      )}
    </Container>
  );
};
export default CategoryPage;
