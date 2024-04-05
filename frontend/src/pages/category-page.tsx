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
  Box,
  Title,
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
import {
  IconChevronRight,
  IconEdit,
  IconInfoCircle,
  IconStar,
  IconTrash,
  IconUserStar,
} from "@tabler/icons-react";

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
      <Breadcrumbs separator={<IconChevronRight />}>
        <Anchor tt="uppercase" size="xs" component={Link} to="/">
          Home
        </Anchor>
        <Anchor tt="uppercase" size="xs">
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
          <Flex
            direction={{ base: "column", sm: "row" }}
            justify="space-between"
            mb="sm"
          >
            <Title order={1} my="md">
              {metaData.displayname}
            </Title>
            {user.isCategoryAdmin && (
              <Group>
                <Button
                  leftSection={<IconEdit />}
                  onClick={() => setEditing(true)}
                >
                  Edit
                </Button>
                <Button
                  color="red"
                  loading={removeLoading}
                  disabled={metaData.slug === "default"}
                  leftSection={<IconTrash />}
                  onClick={onRemove}
                >
                  Delete
                </Button>
              </Group>
            )}
          </Flex>

          <Grid mb="xs">
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
                <Anchor
                  href={metaData.more_exams_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  c="blue"
                >
                  Additional Exams
                </Anchor>
              </Grid.Col>
            )}
            {metaData.remark && <Grid.Col>Remark: {metaData.remark}</Grid.Col>}
          </Grid>
          {(offeredIn === undefined || offeredIn.length > 0) && (
            <Box mb="sm">
              Offered in:
              {loading ? (
                <Loader />
              ) : (
                <List>
                  {offeredIn?.map(meta1 =>
                    meta1.meta2.map(meta2 => (
                      <List.Item key={meta1.displayname + meta2.displayname}>
                        {meta2.displayname} in {meta1.displayname}
                      </List.Item>
                    )),
                  )}
                </List>
              )}
            </Box>
          )}
          <Grid my="sm">
            {metaData.experts.includes(user.username) && (
              <Grid.Col span="auto">
                <Alert
                  color="yellow"
                  title="Category expert"
                  icon={<IconStar />}
                >
                  You are an expert for this category. You can endorse correct
                  answers, which will be visible to other users.
                </Alert>
              </Grid.Col>
            )}
            {metaData.has_payments && (
              <Grid.Col span="auto">
                <Alert color="gray" icon={<IconInfoCircle />}>
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
                <Alert
                  variant="light"
                  color="blue"
                  title="Category admin"
                  icon={<IconUserStar />}
                >
                  You can edit exams in this category. Please do so responsibly.
                </Alert>
              </Grid.Col>
            )}
          </Grid>
          <ExamList metaData={metaData} />

          <DocumentList slug={metaData.slug} />

          {metaData.attachments.length > 0 && (
            <>
              <Title order={2} mt="xl" mb="lg">
                Attachments
              </Title>
              <List>
                {metaData.attachments.map(att => (
                  <List.Item key={att.filename}>
                    <Anchor
                      href={`/api/filestore/get/${att.filename}/`}
                      color="blue"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {att.displayname}
                    </Anchor>
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
    <Container size="xl" mb="xl">
      {error && <Alert color="red">{error.message}</Alert>}
      {data === undefined && <LoadingOverlay visible={loading} />}
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
