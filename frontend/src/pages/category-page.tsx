import { useRequest } from "@umijs/hooks";
import {
  Breadcrumbs,
  Alert,
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
  Tooltip,
  useComputedColorScheme,
  Card,
  Paper,
  Stack,
} from "@mantine/core";
import React, { useCallback, useMemo } from "react";
import { Link, Redirect, Route, Switch, useHistory, useParams, useRouteMatch } from "react-router-dom";
import {
  loadCategoryMetaData,
  loadMetaCategories,
  useRemoveCategory,
  useBICourseList,
} from "../api/hooks";
import {
  loadTestimonials
} from "../api/testimonials";
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
} from "@tabler/icons-react";
import { EuclidCodeBadge } from "../components/euclid-code-badge";
import { useCategoryTabs } from "../hooks/useCategoryTabs";
import { PieChart } from "@mantine/charts";
import { CourseTestimonial, TestimonialCard, ApprovalStatus } from "./testimonials-page";

interface CategoryPageContentProps {
  onMetaDataChange: (newMetaData: CategoryMetaData) => void;
  testimonials: CourseTestimonial[]; 
  metaData: CategoryMetaData;
}


const CategoryPageContent: React.FC<CategoryPageContentProps> = ({
  onMetaDataChange,
  testimonials,
  metaData,
}) => {
  const computedColorScheme = useComputedColorScheme("light");
  console.log(testimonials)
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
  const quickinfo_data = useMemo(() => {
    // While the BI course JSON is loading, it is just a list of undefineds
    if (!bi_courses_data) {
      return metaData.euclid_codes.map(() => undefined);
    }

    // Once data is ready, we turn it into a list of useful info to pass to
    // generate badges.
    return metaData.euclid_codes.map(
      c =>
        Object.values(bi_courses_data).flatMap(course => {
          if (course.euclid_code === c || course.euclid_code_shadow === c) {
            return [{
              code: c,
              acronym: course.acronym,
              name: course.name,
              level: course.level,
              delivery_ordinal: course.delivery_ordinal,
              credits: course.credits,
              cw_exam_ratio: course.cw_exam_ratio,
              course_url: course.course_url,
              euclid_url: course.euclid_url,
              // Set the shadow property to the main course code if this is a shadow
              shadow: course.euclid_code_shadow === c ? course.euclid_code : undefined,
            }];
          }
          return [];
        }),
    ).flat();
  }, [metaData, bi_courses_data]);

  // `path` is the path structure, e.g. the literal string "/category/:slug"
  // whereas `url` is the actual URL, e.g. "/category/algorithms". Thus, for
  // defining Routes, we use `path`, but for Link/navigation we use `url`.
  const { path, url } = useRouteMatch();

  //get testimonial count
  
  // let currentCourseTestimonials : CourseTestimonial[] = quickinfo_data.map((c) => c?.code).testimonials['value'].filter(
  //   (testimonial: CourseTestimonial) => (testimonial.euclid_code == c && testimonial.approval_status == ApprovalStatus.APPROVED
  // ));

  let courseTestimonials = testimonials.filter((testimonial) => (testimonial.category_id === metaData.category_id && testimonial.approval_status == ApprovalStatus.APPROVED)) //filter based on approval status
  const tabs = useCategoryTabs([
    { name: "Resources", id: "resources" },
    { name: "Testimonials", id: "testimonials", count: courseTestimonials? courseTestimonials.length: 0}, //okay haven't finished.
    { name: "Grade Stats", id: "statistics", disabled: true },
  ]); //get testimonial with a specific id

  // TODO: switch to betterinformatics.com/courses.json "session" field once that's live
  const { thisYear, nextYearSuffix } = useMemo(() => {
    const year = new Date().getFullYear();
    return { thisYear: year.toString(), nextYearSuffix: (year + 1).toString().slice(2) };
  }, []);

  return (
    <>
      {modals}
      <Breadcrumbs separator={<IconChevronRight />} styles={{ breadcrumb: { minWidth: 0, textOverflow: "ellipsis", overflow: "hidden"   }}}>
        <Anchor tt="uppercase" size="xs" component={Link} to="/">
          Home
        </Anchor>
        <Anchor
          tt="uppercase"
          size="xs"
        >
          {metaData.displayname}
        </Anchor>
      </Breadcrumbs>
      <Switch>
        <Route path={`${path}/edit` /* this route is listed above the main route so a potential tab with id edit can never take priority over the edit page */}>
          {!user.isCategoryAdmin && <Redirect to={url} />}
          {offeredIn && (
            <CategoryMetaDataEditor
              onMetaDataChange={editorOnMetaDataChange}
              close={() => history.push(`/category/${metaData.slug}`)}
              currentMetaData={metaData}
              offeredIn={offeredIn.flatMap(b =>
                b.meta2.map(d => [b.displayname, d.displayname] as const),
              )}
            />
          )}
        </Route>
        <Route path={path} exact={false /*because useCategoryTabs needs non-exact match*/}>
          <Card withBorder mt="sm">
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
                    component={Link}
                    to={`${url}/edit`}
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
            <Group gap="xs">
              {metaData.euclid_codes.map(
                (code, i) => (
                  <EuclidCodeBadge
                    key={code}
                    code={code}
                    badge_data={quickinfo_data[i]}
                    loading={bi_courses_loading}
                    error={bi_courses_error}
                  />
                ),
              )}
            </Group>
            {metaData.remark && (
              <Text mt="xs">Admin Remarks: {metaData.remark}</Text>
            )}
            {metaData.more_exams_link && (
              <Anchor
                href={metaData.more_exams_link}
                target="_blank"
                rel="noopener noreferrer"
                c="blue"
              >
                Additional Exams
              </Anchor>
            )}
            <Card.Section
              bg="light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-7))"
              mt="xs"
              style={{ overflowX: "auto" /* Allow scrolling tabs if they overflow */ }}
            >
              {tabs.Component}
            </Card.Section>
          </Card>
          {tabs.currentTabId == "resources" && 
          <Grid my="sm" gutter={{ base: "sm", sm: "md" }}>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Paper withBorder p={{ base: "sm", sm: "md" }}>
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
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              {metaData.experts.includes(user.username) && (
                <Alert
                  color="yellow"
                  title="Category expert"
                  icon={<IconStar />}
                  mb="md"
                >
                  You are an expert for this category. You can endorse correct
                  answers, which will be visible to other users.
                </Alert>
              )}
              {metaData.catadmin && (
                <Alert
                  variant="light"
                  color="blue"
                  title="Category admin"
                  icon={<IconUserStar />}
                  mb="md"
                >
                  You can edit exams in this category. Please do so responsibly.
                </Alert>
              )}

              <Paper withBorder p={{ base: "sm", sm: "md" }} mb="md">
                <Title order={2} mb="lg">Info for {thisYear}/{nextYearSuffix} run</Title>
                {quickinfo_data.length === 0 && /*
                  If none of the variants of this course are running this year,
                  we show a message to the user.
                */ (
                  <Text c="dimmed" size="sm">
                    This course is either not running this year or is not an Informatics course.
                  </Text>
                )}
                {quickinfo_data.map((course, i) => (
                  <Stack key={metaData.euclid_codes[i]} mb="sm" gap={0}>
                    <Text>
                      <Text span fw="bold">{metaData.euclid_codes[i]}</Text>
                      {" - "}
                      {course?.course_url && (
                        <>
                          <Anchor
                            href={course.course_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            c="blue"
                          >
                            Course Page
                          </Anchor>
                          {", "}
                        </>
                      )}
                      {course?.euclid_url && (
                        <Anchor
                          href={course.euclid_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          c="blue"
                        >
                          DRPS
                        </Anchor>
                      )}
                    </Text>
                    {course && (
                      <>
                        <Text>
                          {course.name} ({course.acronym})<br />
                          SCQF {course.level} / {course.credits} Credits / Semester {course.delivery_ordinal}
                        </Text>
                        <Group gap="xs">
                          <PieChart
                            size={20}
                            startAngle={90}
                            endAngle={-270}
                            data={[
                              {
                                name: "Coursework",
                                value: course.cw_exam_ratio[0],
                                color: "var(--mantine-primary-color-6)",
                              },
                              {
                                name: "Exam",
                                value: course.cw_exam_ratio[1],
                                color: "var(--mantine-primary-color-8)",
                              },
                            ]}
                          />
                          <Text>
                            {course.cw_exam_ratio[0] > 0 && `${course.cw_exam_ratio[0]}% Coursework`}
                            {course.cw_exam_ratio[0] > 0 && course.cw_exam_ratio[1] > 0 && " + "}
                            {course.cw_exam_ratio[1] > 0 && `${course.cw_exam_ratio[1]}% Exam`}
                          </Text>
                        </Group>
                      </>
                    )}
                    {!course && (
                      <Text c="dimmed">
                        No course information available for this code.
                      </Text>
                    )}
                  </Stack>
                ))}
              </Paper>

              {metaData.more_markdown_link && (
                <Paper withBorder p={{ base: "sm", sm: "md" }}>
                  <Group align="baseline" justify="space-between" mb="sm">
                    <Title order={2}>Useful Links</Title>
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
                          Edit
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
                    <Text c={computedColorScheme === "light" ? "gray.7" : "gray.4"}>
                      <MarkdownText
                        value={raw_md_contents}
                        localLinkBase="https://betterinformatics.com"
                        ignoreHtml={true}
                      />
                    </Text>
                  )}
                </Paper>
              )}
            </Grid.Col>
          </Grid>
        }
        <Stack p={10}>
          {
            tabs.currentTabId=="testimonials" && courseTestimonials.map((testimonial, index) => //add a key to the testimonial
              <TestimonialCard key={index} currentUserUsername = {String(user == undefined? "": user.username)} isAdmin={user==undefined? false : user.isAdmin} username={String(testimonial.author_id)} displayName={String(testimonial.author_diplay_name)} category_id={testimonial.category_id} yearTaken={String(testimonial.year_taken)} testimonial={String(testimonial.testimonial)} testimonial_id={String(testimonial.testimonial_id)}></TestimonialCard>)
          }
        </Stack>

        </Route>
      </Switch>
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
  const { data : testimonials, loading: loading_testimonials, error: error_testimonials, refresh } = useRequest(
    () => loadTestimonials()
  );
  return (
    <Container size="xl" mb="xl" p={{ base: "xs", sm: "md" }}>
      {error && <Alert color="red">{error.message}</Alert>}
      {(data === undefined && testimonials == undefined) && <LoadingOverlay visible={loading} />}
      {console.log("DATA UPDATE")}
      {console.log(data)}
      {data && testimonials && (
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
            testimonials = {testimonials["value"]}
            onMetaDataChange={onMetaDataChange}
          />
        </UserContext.Provider>
      )}
    </Container>
  );
};
export default CategoryPage;
