import { useLocalStorageState, useRequest } from "@umijs/hooks";
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  FormGroup,
  Icon,
  ICONS,
  InputField,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
  Select,
  Spinner,
} from "@vseth/components";
import React, { useCallback, useMemo, useState } from "react";
import { fetchGet, fetchPost } from "../api/fetch-utils";
import { User, useUser } from "../auth";
import CategoryCard from "../components/category-card";
import Grid from "../components/grid";
import LoadingOverlay from "../components/loading-overlay";
import ContentContainer from "../components/secondary-container";
import TooltipButton from "../components/TooltipButton";
import { CategoryMetaData, MetaCategory } from "../interfaces";
import useTitle from "../hooks/useTitle";

enum Mode {
  Alphabetical,
  BySemester,
}
const options = [
  { value: Mode.Alphabetical.toString(), label: "Alphabetical" },
  { value: Mode.BySemester.toString(), label: "By Semester" },
];

const loadCategories = async () => {
  return (await fetchGet("/api/category/listwithmeta/"))
    .value as CategoryMetaData[];
};
const loadMetaCategories = async () => {
  return (await fetchGet("/api/category/listmetacategories/"))
    .value as MetaCategory[];
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
      if (categories.length === 0) continue;
      meta2Map.set(meta2display, categories);
    }
    if (meta2Map.size === 0) continue;
    meta1Map.set(
      meta1display,
      [...meta2Map.entries()].sort(([a], [b]) => a.localeCompare(b)),
    );
  }
  return [...meta1Map.entries()].sort(([a], [b]) => a.localeCompare(b));
};

const AddCategory: React.FC<{ onAddCategory: () => void }> = ({
  onAddCategory,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { loading, run } = useRequest(addCategory, {
    manual: true,
    onSuccess: () => {
      setCategoryName("");
      setIsOpen(false);
      onAddCategory();
    },
  });
  const [categoryName, setCategoryName] = useState("");
  const onSubmit = () => {
    run(categoryName);
  };

  return (
    <>
      <Modal isOpen={isOpen} toggle={() => setIsOpen(false)}>
        <ModalHeader>Add Category</ModalHeader>
        <ModalBody>
          <InputField
            label="Category Name"
            type="text"
            value={categoryName}
            onChange={e => setCategoryName(e.currentTarget.value)}
          />
        </ModalBody>
        <ModalFooter>
          <Button
            onClick={onSubmit}
            disabled={categoryName.length === 0 || loading}
          >
            {loading ? <Spinner /> : "Add Category"}
          </Button>
        </ModalFooter>
      </Modal>
      <Card style={{ minHeight: "10em" }}>
        <TooltipButton
          tooltip="Add a new category"
          onClick={() => setIsOpen(true)}
          className="position-cover w-100"
        >
          <Icon icon={ICONS.PLUS} size={40} className="m-auto" />
        </TooltipButton>
      </Card>
    </>
  );
};

const HomePage: React.FC<{}> = () => {
  useTitle("VIS Community Solutions");
  const { isAdmin } = useUser() as User;
  const [mode, setMode] = useLocalStorageState("mode", Mode.Alphabetical);
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
  const filteredCategories = useMemo(
    () =>
      categories
        ? categories.filter(({ displayname }) =>
            displayname
              .toLocaleLowerCase()
              .includes(filter.toLocaleLowerCase()),
          )
        : undefined,
    [filter, categories],
  );
  const filteredMetaCategories = useMemo(
    () =>
      filteredCategories && metaCategories
        ? mapToCategories(filteredCategories, metaCategories)
        : undefined,
    [filteredCategories, metaCategories],
  );

  const onAddCategory = useCallback(() => {
    run();
  }, [run]);

  return (
    <>
      <Container>
        <h1>Community Solutions</h1>
      </Container>
      <Container>
        <Row form>
          <Col md={4}>
            <FormGroup className="m-1">
              <Select
                options={[options[Mode.Alphabetical], options[Mode.BySemester]]}
                defaultValue={options[mode]}
                onChange={(e: any) => setMode(e.value | 0)}
              />
            </FormGroup>
          </Col>
          <Col md={8}>
            <FormGroup className="m-1">
              <div className="search m-0">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Filter..."
                  value={filter}
                  onChange={e => setFilter(e.currentTarget.value)}
                />
                <div className="search-icon-wrapper">
                  <div className="search-icon" />
                </div>
              </div>
            </FormGroup>
          </Col>
        </Row>
      </Container>
      <ContentContainer className="position-relative">
        <LoadingOverlay loading={loading} />
        <Container>
          {error ? (
            <Alert color="danger">{error.toString()}</Alert>
          ) : mode === Mode.Alphabetical ? (
            <>
              <Grid>
                {filteredCategories &&
                  filteredCategories.map(category => (
                    <CategoryCard category={category} key={category.slug} />
                  ))}
                {isAdmin && <AddCategory onAddCategory={onAddCategory} />}
              </Grid>
            </>
          ) : (
            <>
              {filteredMetaCategories &&
                filteredMetaCategories.map(([meta1display, meta2]) => (
                  <div key={meta1display}>
                    <h4 className="my-4">{meta1display}</h4>
                    {meta2.map(([meta2display, categories]) => (
                      <div key={meta2display}>
                        <h5 className="my-3">{meta2display}</h5>
                        <Grid>
                          {categories.map(category => (
                            <CategoryCard
                              category={category}
                              key={category.slug}
                            />
                          ))}
                        </Grid>
                      </div>
                    ))}
                  </div>
                ))}
              {isAdmin && (
                <>
                  <h4 className="my-3">New Category</h4>
                  <Grid>
                    <AddCategory onAddCategory={onAddCategory} />
                  </Grid>
                </>
              )}
            </>
          )}
        </Container>
      </ContentContainer>
    </>
  );
};
export default HomePage;
