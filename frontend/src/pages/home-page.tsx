import {
  Alert,
  Button,
  Container,
  Flex,
  Loader,
  Modal,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { useLocalStorageState, useRequest } from "@umijs/hooks";
import React, { useCallback, useMemo, useState } from "react";
import { authenticated, fetchGet, fetchPost } from "../api/fetch-utils";
import { loadMetaCategories } from "../api/hooks";
import { User, useUser } from "../auth";
import CategoryCard from "../components/category-card";
import Grid from "../components/grid";
import ContentContainer from "../components/secondary-container";
import useSearch from "../hooks/useSearch";
import useTitle from "../hooks/useTitle";
import { CategoryMetaData, MetaCategory } from "../interfaces";
import CourseCategoriesPanel from "../components/course-categories-panel";
import { IconPlus, IconSearch} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import KawaiiBetterInformatics from "../assets/kawaii-betterinformatics.svg?react";
import { getFavourites } from "../api/favourite";
import { EditMeta1, EditMeta2 } from "../components/edit-meta-categories";

const displayNameGetter = (data: CategoryMetaData) => data.displayname;

const loadCategories = async () => {
  return (await fetchGet("/api/category/listwithmeta/"))
    .value as CategoryMetaData[];
};
const loadCategoryData = async () => {
  const [categories, metaCategories, favourites] = await Promise.all([
    loadCategories(),
    loadMetaCategories(),
    authenticated() ? getFavourites() : Promise.resolve([]),
  ]);
  return [
    categories.sort((a, b) => a.displayname.localeCompare(b.displayname)),
    metaCategories,
    favourites,
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
      <Paper withBorder shadow="md" style={{ minHeight: "10em" }}>
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
  const [uwu, _] = useLocalStorageState("uwu", false);
  return (
    <>
      <Container size="xl" mb="sm">
        {uwu ? (
          <Container size="sm" mb="lg">
            <KawaiiBetterInformatics />
          </Container>
        ) : (
          <>
            <Text lh={1}>Better&shy;Informatics</Text>
            <Title mb="sm">File Collection</Title>
          </>
        )}
        <Text fw={500}>
          BetterInformatics File Collection is a platform for students to share
          notes, summaries, tips and recommendations for courses, as well as a
          study platform to collaborate on answers to previous exams.
        </Text>
      </Container>
      <CategoryList />
    </>
  );
};

type Mode = "alphabetical" | "bySCQF" | "favourites";

export const CategoryList: React.FC<{}> = () => {
  const { isAdmin } = useUser() as User;
  const user = useUser();
  const [mode, setMode] = useLocalStorageState<Mode>(
    "category-list-mode",
    "alphabetical",
  ); // default to alphabetical
  const [filter, setFilter] = useState("");
  // Check for local storage cache of category data and use that as a backup
  // while the actual request is loading
  const [localStorageCategoryData, setLocalStorageCategoryData] =
    useLocalStorageState<[CategoryMetaData[]?, MetaCategory[]?, string[]?]>(
      "category-data",
      [undefined, undefined, undefined],
    );
  // Run the promise to get the various category data
  const { data, error, loading, run } = useRequest(loadCategoryData, {
    cacheKey: "category-data",
    onSuccess: data => {
      // Update the cache with the new data.
      // onSuccess gives us a readonly array, so cast it to a mutable array
      setLocalStorageCategoryData(
        data as [CategoryMetaData[], MetaCategory[], string[]],
      );
    },
  });

  // Combine the data from the request with the local storage cache, preferring
  // the actual data. Each of the three elements in the array can be 'undefined'
  // when neither the cache or the request have been loaded yet. This is
  // different from an empty array which implies the loaded data is empty.
  const [categoriesWithDefault, metaCategories, favourites] =
    data ?? localStorageCategoryData;

  const categories = useMemo(
    () =>
      categoriesWithDefault
        ? categoriesWithDefault
            .filter(({ slug }) => slug !== "default" || isAdmin)
            .map(category => ({
              ...category,
              favourite: favourites
                ? favourites.includes(category.slug)
                : false,
            }))
        : undefined,
    [categoriesWithDefault, isAdmin, favourites],
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

  const favouriteCategories = useMemo(
    () => categories?.filter(c => c.favourite),
    [categories],
  );
  const onFavouriteToggle = useCallback(() => {
    run();
  }, [run]);

  const slugify = (str: string): string =>
    str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

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
            onChange={(value: string) => {
              setMode(value as Mode);
            }}
            data={[
              { label: "Alphabetical", value: "alphabetical" },
              { label: "By SCQF", value: "bySCQF" },
              ...(user?.loggedin ? [{
                label: "Favourites",
                value: "favourites",
                disabled: !favourites,
              }] : []),
            ]}
          />
          <TextInput
            placeholder="Filter..."
            value={filter}
            onChange={e => setFilter(e.currentTarget.value)}
            leftSection={
              <IconSearch style={{ height: "15px", width: "15px" }} />
            }
          />
        </Flex>
      </Container>
      <ContentContainer>
        <Container size="xl" py="md" pos="relative">
          {loading && !error && (
            <Loader size="xs" color="gray" pos="absolute" top={0} right={0} />
          )}
          {error ? (
            <Alert color="red">{error.toString()}</Alert>
          ) : mode === "alphabetical" || filter.length > 0 ? (
            <>
              <Grid>
                {searchResult.map(category => (
                  <CategoryCard
                    category={category}
                    key={category.slug}
                    onFavouriteToggle={onFavouriteToggle}
                  />
                ))}
                {isAdmin && <AddCategory onAddCategory={onChange} />}
              </Grid>
            </>
          ) : mode === "bySCQF" ? (
            <>
              {metaList &&
                metaList.map(([meta1display, meta2]) => (
                  <div key={meta1display} id={slugify(meta1display)}>
                    <Title order={2} my="sm">
                      <Flex
                        gap="md"
                        direction={{base: "row"}}
                        justify="start"
                      >
                        {meta1display}
                        {isAdmin && <EditMeta1 oldMeta1={meta1display} onChange={onChange}/>}
                      </Flex>
                    </Title>
                    {meta2.map(([meta2display, categories]) => (
                      <div
                        key={meta2display}
                        id={slugify(meta1display) + slugify(meta2display)}
                      >
                        <Title order={3} my="md">
                          <Flex
                          gap="md"
                          direction={{base: "row"}}
                          justify="start"
                          >
                            {meta2display}
                            {isAdmin && <EditMeta2 oldMeta2={meta2display}  meta1={meta1display} onChange={onChange}/>}
                          </Flex>
                        </Title>
                        <Grid>
                          {categories.map(category => (
                            <CategoryCard
                              category={category}
                              key={category.slug}
                              onFavouriteToggle={onFavouriteToggle}
                            />
                          ))}
                        </Grid>
                      </div>
                    ))}
                  </div>
                ))}
              {unassignedList && unassignedList.length > 0 && (
                <>
                  <Title order={3} my="md">
                    Unassigned Categories
                  </Title>
                  <Grid>
                    {unassignedList.map(category => (
                      <CategoryCard
                        category={category}
                        key={category.slug}
                        onFavouriteToggle={onFavouriteToggle}
                      />
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
          ) : (
            // favourites
            <>
              <Grid>
                {favouriteCategories && favouriteCategories.length > 0 ? (
                  favouriteCategories.map(category => (
                    <CategoryCard
                      category={category}
                      key={category.slug}
                      onFavouriteToggle={onFavouriteToggle}
                    />
                  ))
                ) : (
                  <Text>No favourite categories</Text>
                )}
              </Grid>
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
