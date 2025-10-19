import {
  Alert,
  Button,
  Collapse,
  Container,
  Flex,
  Group,
  Loader,
  Modal,
  Paper,
  SegmentedControl,
  Stack,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { useLocalStorageState, useRequest } from "@umijs/hooks";
import React, { useCallback, useMemo, useState } from "react";
import { fetchGet, fetchPost } from "../api/fetch-utils";
import { loadMetaCategories } from "../api/hooks";
import { User, useUser } from "../auth";
import CategoryCard from "../components/category-card";
import Grid from "../components/grid";
import LoadingOverlay from "../components/loading-overlay";
import ContentContainer from "../components/secondary-container";
import useSearch from "../hooks/useSearch";
import useTitle from "../hooks/useTitle";
import { CategoryMetaData, MetaCategory } from "../interfaces";
import CourseCategoriesPanel from "../components/course-categories-panel";
import {
  IconChevronDown,
  IconChevronUp,
  IconPlus,
  IconSearch,
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { EditMeta1, EditMeta2 } from "../components/edit-meta-categories";
import TooltipButton from "../components/TooltipButton";
import CollapseWrapper from "../components/collapse-wrapper";
import clsx from "clsx";
import classes from "../utils/focus-outline.module.css";

const displayNameGetter = (data: CategoryMetaData) => data.displayname;

const loadCategories = async () => {
  return (await fetchGet("/api/category/listwithmeta/"))
    .value as CategoryMetaData[];
};
const loadCategoryData = async () => {
  const [categories, metaCategories] = await Promise.all([
    loadCategories(),
    loadMetaCategories(),
  ]);
  return [
    categories.sort((a, b) => a.displayname.localeCompare(b.displayname)),
    metaCategories,
  ] as const;
};
const addCategory = async (category: string) => {
  await fetchPost("/api/category/add/", { category });
};

const mapToCategories = (
  categories: CategoryMetaData[],
  meta1: MetaCategory[],
) => {
  const categoryMap = new Map<string, CategoryMetaData>();
  const assignedCategories = new WeakSet<CategoryMetaData>();
  for (const category of categories) categoryMap.set(category.slug, category);
  const meta1Map: Map<string, Array<[string, CategoryMetaData[]]>> = new Map();
  for (const { displayname: meta1display, meta2 } of meta1) {
    const meta2Map: Map<string, CategoryMetaData[]> = new Map();
    for (const {
      displayname: meta2display,
      categories: categoryNames,
    } of meta2) {
      const categories = categoryNames
        .map(name => categoryMap.get(name)!)
        .filter(a => a !== undefined);
      for (const category of categories) assignedCategories.add(category);
      if (categories.length === 0) continue;
      meta2Map.set(meta2display, categories);
    }
    if (meta2Map.size === 0) continue;
    meta1Map.set(
      meta1display,
      [...meta2Map.entries()].sort(([a], [b]) => a.localeCompare(b)),
    );
  }
  const metaList = [...meta1Map.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  );
  const unassignedList = categories.filter(c => !assignedCategories.has(c));
  return [metaList, unassignedList] as const;
};

const AddCategory: React.FC<{ onAddCategory: () => void }> = ({
  onAddCategory,
}) => {
  const [
    addCategoryModalIsOpen,
    { open: openAddCategoryModal, close: closeAddCategoryModal },
  ] = useDisclosure();
  const { loading, run } = useRequest(addCategory, {
    manual: true,
    onSuccess: () => {
      setCategoryName("");
      closeAddCategoryModal();
      onAddCategory();
    },
  });
  const [categoryName, setCategoryName] = useState("");
  const onSubmit = () => {
    run(categoryName);
  };

  return (
    <>
      <Modal
        opened={addCategoryModalIsOpen}
        onClose={closeAddCategoryModal}
        title="Add Category"
      >
        <Stack>
          <TextInput
            label="Category Name"
            type="text"
            value={categoryName}
            onChange={e => setCategoryName(e.currentTarget.value)}
          />
          <Button
            onClick={onSubmit}
            disabled={categoryName.length === 0 || loading}
          >
            {loading ? <Loader /> : "Add Category"}
          </Button>
        </Stack>
      </Modal>
      <Paper
        className={clsx(classes.focusOutline, classes.hoverShadow)}
        style={{ minHeight: "10em" }}
      >
        <Tooltip label="Add a new category" withinPortal>
          <Button
            color="dark"
            style={{ width: "100%", height: "100%" }}
            onClick={openAddCategoryModal}
            leftSection={<IconPlus />}
          >
            Add new category
          </Button>
        </Tooltip>
      </Paper>
    </>
  );
};

const HomePage: React.FC<{}> = () => {
  useTitle("Home");
  return (
    <>
      <Container size="xl">
        <Title mb="sm">Community Solutions</Title>
      </Container>
      <CategoryList />
    </>
  );
};
export const CategoryList: React.FC<{}> = () => {
  const { isAdmin } = useUser() as User;
  const [mode, setMode] = useLocalStorageState("mode", "alphabetical");
  const [collapsedCategories, setCollapsedCategories] = useLocalStorageState<
    string[]
  >("collapsedCategories", []);
  const [filter, setFilter] = useState("");
  const { data, error, loading, run } = useRequest(loadCategoryData, {
    cacheKey: "category-data",
  });
  const [categoriesWithDefault, metaCategories] = data ? data : [];

  const categories = useMemo(
    () =>
      categoriesWithDefault
        ? categoriesWithDefault.filter(
            ({ slug }) => slug !== "default" || isAdmin,
          )
        : undefined,
    [categoriesWithDefault, isAdmin],
  );
  const searchResult = useSearch(
    categories ?? [],
    filter,
    Math.min(filter.length * 2, 12),
    displayNameGetter,
  );
  const [metaList, unassignedList] = useMemo(
    () =>
      metaCategories && categories
        ? mapToCategories(categories, metaCategories)
        : [undefined, undefined],
    [categories, metaCategories],
  );

  const onChange = useCallback(() => {
    run();
  }, [run]);
  const [panelIsOpen, { toggle: togglePanel }] = useDisclosure();

  const slugify = (str: string): string =>
    str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const is_collapsed = (category: string): boolean => {
    return collapsedCategories.includes(slugify(category));
  };

  const collapse_expand = (category: string): void => {
    if (is_collapsed(category)) {
      setCollapsedCategories(
        collapsedCategories.filter(a => a !== slugify(category)),
      );
    } else {
      setCollapsedCategories([...collapsedCategories, slugify(category)]);
    }
  };

  return (
    <>
      <Container size="xl">
        <Flex
          gap="md"
          direction={{ base: "column", sm: "row" }}
          justify="space-between"
        >
          <SegmentedControl
            value={mode}
            onChange={setMode}
            data={[
              { label: "Alphabetical", value: "alphabetical" },
              { label: "By Semester", value: "bySemester" },
            ]}
          />
          <TextInput
            placeholder="Filter..."
            value={filter}
            autoFocus
            onChange={e => setFilter(e.currentTarget.value)}
            leftSection={
              <IconSearch style={{ height: "15px", width: "15px" }} />
            }
          />
        </Flex>
      </Container>
      <ContentContainer>
        <LoadingOverlay visible={loading} />
        <Container size="xl" py="md">
          {error ? (
            <Alert color="red">{error.toString()}</Alert>
          ) : mode === "alphabetical" || filter.length > 0 ? (
            <>
              <Grid>
                {searchResult.map(category => (
                  <CategoryCard category={category} key={category.slug} />
                ))}
                {isAdmin && <AddCategory onAddCategory={onChange} />}
              </Grid>
            </>
          ) : (
            <>
              {metaList &&
                metaList.map(([meta1display, meta2]) => (
                  <div key={meta1display} id={slugify(meta1display)}>
                    <CollapseWrapper
                      title={
                        <Title order={2} my="sm">
                          {meta1display}
                        </Title>
                      }
                      contentOutsideCollapse={
                        <Group>
                          {isAdmin && (
                            <EditMeta1
                              oldMeta1={meta1display}
                              onChange={onChange}
                            />
                          )}
                        </Group>
                      }
                      contentInsideCollapse={meta2.map(
                        ([meta2display, categories]) => (
                          <div
                            key={meta2display}
                            id={slugify(meta1display + meta2display)}
                          >
                            <CollapseWrapper
                              title={
                                <Title order={3} my="sm">
                                  {meta2display}
                                </Title>
                              }
                              contentOutsideCollapse={
                                <Group>
                                  {isAdmin && (
                                    <EditMeta2
                                      oldMeta2={meta2display}
                                      meta1={meta1display}
                                      onChange={onChange}
                                    />
                                  )}
                                </Group>
                              }
                              contentInsideCollapse={
                                <Grid>
                                  {categories.map(category => (
                                    <CategoryCard
                                      category={category}
                                      key={category.slug}
                                    />
                                  ))}
                                </Grid>
                              }
                              is_collapsed={() =>
                                is_collapsed(meta1display + meta2display)
                              }
                              collapse_expand={() =>
                                collapse_expand(meta1display + meta2display)
                              }
                            />
                          </div>
                        ),
                      )}
                      is_collapsed={() => is_collapsed(meta1display)}
                      collapse_expand={() => collapse_expand(meta1display)}
                    />
                  </div>
                ))}
              {unassignedList && unassignedList.length > 0 && (
                <>
                  <Title order={3} my="md">
                    Unassigned Categories
                  </Title>
                  <Grid>
                    {unassignedList.map(category => (
                      <CategoryCard category={category} key={category.slug} />
                    ))}
                  </Grid>
                </>
              )}
              {isAdmin && (
                <>
                  <Title order={3} my="md">
                    New Category
                  </Title>
                  <Grid>
                    <AddCategory onAddCategory={onChange} />
                  </Grid>
                </>
              )}
            </>
          )}
        </Container>
      </ContentContainer>
      {!loading ? (
        <CourseCategoriesPanel
          mode={mode}
          isOpen={panelIsOpen}
          toggle={togglePanel}
          metaList={metaList}
        />
      ) : null}
    </>
  );
};
export default HomePage;
