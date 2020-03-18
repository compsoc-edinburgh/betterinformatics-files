import { useLocalStorageState, useRequest } from "@umijs/hooks";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardFooter,
  Col,
  Container,
  Form,
  FormGroup,
  Input,
  Progress,
  Row,
  Select,
  Spinner,
} from "@vseth/components";
import React, { useCallback, useMemo, useState } from "react";
import { User, useUser } from "../auth";
import Grid from "../components/grid";
import TextLink from "../components/text-link";
import { fetchapi } from "../fetch-utils";
import { CategoryMetaData, MetaCategory } from "../interfaces";

enum Mode {
  Alphabetical,
  BySemester,
}
const options = [
  { value: Mode.Alphabetical.toString(), label: "Alphabetical" },
  { value: Mode.BySemester.toString(), label: "By Semester" },
];

const loadCategories = async () => {
  return (await fetchapi("/api/listcategories/withmeta"))
    .value as CategoryMetaData[];
};
const loadMetaCategories = async () => {
  return (await fetchapi("/api/listmetacategories")).value as MetaCategory[];
};
const loadCategoryData = async () => {
  const [categories, metaCategories] = await Promise.all([
    loadCategories(),
    loadMetaCategories(),
  ]);
  return [
    categories.sort((a, b) => a.category.localeCompare(b.category)),
    metaCategories,
  ] as const;
};
const addCategory = async (name: string) => {
  return new Promise(resolve => {
    setTimeout(resolve, 1000);
  });
};

const mapToCategories = (
  categories: CategoryMetaData[],
  meta1: MetaCategory[],
) => {
  const categoryMap = new Map<string, CategoryMetaData>();
  for (const category of categories)
    categoryMap.set(category.category, category);
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

const Category: React.FC<{ category: CategoryMetaData }> = ({ category }) => {
  return (
    <TextLink to={`category/${category.slug}`} style={{ color: "black" }}>
      <Card>
        <CardBody>
          <h5>{category.category}</h5>
          <div>
            Exams:{" "}
            {`${category.examcountanswered} / ${category.examcountpublic}`}
          </div>
          <div>Answers: {(category.answerprogress * 100).toString()} %</div>
        </CardBody>
        <CardFooter>
          <Progress value={category.answerprogress} max={1} />
        </CardFooter>
      </Card>
    </TextLink>
  );
};
const AddCategory: React.FC<{ onAddCategory: (name: string) => void }> = ({
  onAddCategory,
}) => {
  const { loading, run } = useRequest(addCategory, { manual: true });
  const [categoryName, setCategoryName] = useState("");
  const onSubmit = () => {
    setCategoryName("");
    run(categoryName);
    onAddCategory(categoryName);
  };
  return (
    <Card>
      <CardBody>
        <h5>Add Category</h5>
        <Input
          type="text"
          placeholder="Category Name"
          value={categoryName}
          onChange={e => setCategoryName(e.currentTarget.value)}
        />
      </CardBody>
      <CardFooter>
        <Button
          onClick={onSubmit}
          disabled={categoryName.length === 0 || loading}
        >
          {loading ? <Spinner /> : "Add Category"}
        </Button>
      </CardFooter>
    </Card>
  );
};

const HomePage: React.FC<{}> = () => {
  const { isAdmin } = useUser() as User;
  const [mode, setMode] = useLocalStorageState<Mode>("mode", Mode.Alphabetical);
  const [filter, setFilter] = useState("");
  const { data, error, loading } = useRequest(loadCategoryData, {
    cacheKey: "category-data",
  });
  const [categoriesWithDefault, metaCategories] = data ? data : [];

  const categories = useMemo(
    () =>
      categoriesWithDefault
        ? categoriesWithDefault.filter(
            ({ category }) => category !== "default" || isAdmin,
          )
        : undefined,
    [categoriesWithDefault, isAdmin],
  );
  const filteredCategories = useMemo(
    () =>
      categories
        ? categories.filter(({ category }) =>
            category.toLocaleLowerCase().includes(filter.toLocaleLowerCase()),
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

  const onAddCategory = useCallback((categoryName: string) => {
    console.log(categoryName);
  }, []);

  return (
    <Container>
      <h1>Community Solutions</h1>

      <Form>
        <Row form>
          <Col md={4}>
            <FormGroup>
              <Select
                options={[options[Mode.Alphabetical], options[Mode.BySemester]]}
                defaultValue={options[mode]}
                onChange={(e: any) => setMode(e.value | 0)}
              />
            </FormGroup>
          </Col>
          <Col md={8}>
            <FormGroup>
              <div className="search">
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
      </Form>
      {error ? (
        <Alert>{error.message}</Alert>
      ) : loading ? (
        <Spinner />
      ) : mode === Mode.Alphabetical ? (
        filteredCategories && (
          <Grid>
            {filteredCategories.map(category => (
              <Category category={category} key={category.slug} />
            ))}
            {isAdmin && <AddCategory onAddCategory={onAddCategory} />}
          </Grid>
        )
      ) : (
        filteredMetaCategories && (
          <>
            {filteredMetaCategories.map(([meta1display, meta2]) => (
              <div key={meta1display}>
                <h4>{meta1display}</h4>
                {meta2.map(([meta2display, categories]) => (
                  <div key={meta2display}>
                    <h5>{meta2display}</h5>
                    <Grid>
                      {categories.map(category => (
                        <Category category={category} key={category.slug} />
                      ))}
                    </Grid>
                  </div>
                ))}
              </div>
            ))}
            {isAdmin && (
              <>
                <h4>New Category</h4>
                <Grid>
                  <AddCategory onAddCategory={onAddCategory} />
                </Grid>
              </>
            )}
          </>
        )
      )}
    </Container>
  );
};
export default HomePage;
