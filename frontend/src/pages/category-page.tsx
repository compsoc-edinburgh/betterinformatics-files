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
  Skeleton,
  Text,
  Title,
  Paper,
  HoverCardDropdown,
  HoverCardTarget,
  HoverCard,
  Tooltip,
  useComputedColorScheme,
} from "@mantine/core";
import React, { useCallback, useMemo, useState } from "react";
import { Link, useHistory, useParams } from "react-router-dom";
import {
  loadCategoryMetaData,
  loadMetaCategories,
  useRemoveCategory,
  useBICourseList,
} from "../api/hooks";
import { UserContext, useUser } from "../auth";
import CategoryMetaDataEditor from "../components/category-metadata-editor";
import ExamList from "../components/exam-list";
import LoadingOverlay from "../components/loading-overlay";
import DocumentList from "../components/document-list";
import useConfirm from "../hooks/useConfirm";
import useTitle from "../hooks/useTitle";
import MarkdownText from "../components/markdown-text";
import { CategoryMetaData } from "../interfaces";
import {
  getMetaCategoriesForCategory,
  removeMarkdownFrontmatter,
  useEditableMarkdownLink,
} from "../utils/category-utils";
import {
  IconChevronRight,
  IconEdit,
  IconStar,
  IconTrash,
  IconUserStar,
  IconInfoCircle,
} from "@tabler/icons-react";

interface CategoryPageContentProps {
  onMetaDataChange: (newMetaData: CategoryMetaData) => void;
  metaData: CategoryMetaData;
}
const CategoryPageContent: React.FC<CategoryPageContentProps> = ({
  onMetaDataChange,
  metaData,
}) => {
  const computedColorScheme = useComputedColorScheme("light");

  const {
    data,
    loading: _,
    run,
  } = useRequest(loadMetaCategories, {
    cacheKey: "meta-categories",
  });

  // Fetch the content at data.more_markdown_link (should be CSP-compliant
  // because we verify before storing it in the database)
  const {
    data: raw_md_contents,
    loading: md_loading,
    error: md_error,
  } = useRequest(
    () =>
      fetch(metaData.more_markdown_link)
        .then(r => r.text())
        .then(m => removeMarkdownFrontmatter(m)),
    {
      // cache and set a liberal throttle (ms) to avoid frequently fetching
      // something that doesn't change too often
      refreshDeps: [metaData],
      cacheKey: `category-md-${metaData.slug}`,
      throttleInterval: 1800000,
    },
  );
  const { editable: md_editable, link: md_edit_link } = useEditableMarkdownLink(
    metaData.more_markdown_link,
  );

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

  const [bi_courses_error, bi_courses_loading, bi_courses_data] =
    useBICourseList();
  const asynchronously_updated_euclid_codes = useMemo(() => {
    // While the BI course JSON is loading, it is just a list of codes with
    // no BI course data
    if (bi_courses_loading || !bi_courses_data) {
      return metaData.euclid_codes.map(c => [c, undefined, undefined] as const);
    }

    // Once data is ready, it becomes a list of codes and BI course data
    return metaData.euclid_codes.map(
      c =>
        [
          c,
          Object.values(bi_courses_data).find(d => d.euclid_code === c),
          Object.values(bi_courses_data).find(d => d.euclid_code_shadow === c),
        ] as const,
    );
  }, [metaData, bi_courses_loading, bi_courses_data]);
  return (
    <>
      {modals}
      <Breadcrumbs separator={<IconChevronRight />}>
        <Anchor tt="uppercase" size="xs" component={Link} to="/">
          Home
        </Anchor>
        <Anchor
          tt="uppercase"
          size="xs"
          style={{ wordBreak: "break-word", textWrap: "pretty" }}
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
          <Group gap="xs" mt="lg">
            {asynchronously_updated_euclid_codes.map(
              ([code, bi_data, shadow_data]) => (
                <HoverCard shadow="md" styles={{ dropdown: { maxWidth: 300 } }}>
                  <HoverCardTarget>
                    <Badge
                      // Will show red if data isn't available or still loading
                      color={bi_data || shadow_data ? "violet" : "red"}
                      radius="xs"
                      component="a"
                      // Choose course URL over EUCLID URL
                      href={
                        bi_data?.course_url ??
                        bi_data?.euclid_url ??
                        shadow_data?.course_url ??
                        shadow_data?.euclid_url_shadow
                      }
                      // Badges don't look clickable by default, use pointer
                      styles={{
                        root: {
                          cursor:
                            bi_data || shadow_data ? "pointer" : "default",
                        },
                      }}
                    >
                      {code}
                    </Badge>
                  </HoverCardTarget>
                  {(bi_data || shadow_data || !bi_courses_loading) && (
                    <HoverCardDropdown>
                      <Text size="sm">
                        {bi_data &&
                          `${bi_data.name} (SCQF ${bi_data.level}, Semester ${bi_data.delivery_ordinal})`}
                        {shadow_data &&
                          `${shadow_data.name} (Shadow of ${shadow_data.euclid_code})`}
                        {!bi_courses_loading &&
                          !bi_data &&
                          !shadow_data &&
                          "Not Running"}
                        {bi_courses_error && bi_courses_error.message}
                      </Text>
                    </HoverCardDropdown>
                  )}
                </HoverCard>
              ),
            )}
          </Group>

          <Flex
            direction={{ base: "column", sm: "row" }}
            justify="space-between"
          >
            <Title order={1} mb="md">
              {metaData.displayname}
            </Title>
            {user.isCategoryAdmin && (
              <Group justify="flex-end">
                <Button
                  leftSection={<IconEdit />}
                  onClick={() => setEditing(true)}
                  color="dark"
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

          {(metaData.more_exams_link || metaData.remark) && (
            <Grid mb="xs">
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
              {metaData.remark && (
                <Grid.Col>Remark: {metaData.remark}</Grid.Col>
              )}
            </Grid>
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

          {metaData.more_markdown_link && (
            <>
              <Group align="baseline" justify="space-between" mt="sm" mb="sm">
                <Title order={2}>Community Knowledgebase</Title>
                {md_editable && (
                  <Tooltip label="Edit this page on GitHub">
                    <Button
                      size="compact-sm"
                      variant="light"
                      component="a"
                      target="_blank"
                      href={md_edit_link}
                      visibleFrom="md"
                    >
                      Edit (anyone welcome!)
                    </Button>
                  </Tooltip>
                )}
              </Group>
              {md_loading && !raw_md_contents && <Skeleton height="2rem" />}
              {md_error && (
                <Alert color="red">
                  Failed to render additional info: {md_error.message}
                </Alert>
              )}
              {raw_md_contents !== undefined && (
                <Text c={computedColorScheme == "light" ? "gray.7" : "gray.4"}>
                  <MarkdownText
                    value={raw_md_contents}
                    localLinkBase="https://betterinformatics.com"
                    ignoreHtml={true}
                  />
                </Text>
              )}
            </>
          )}
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
