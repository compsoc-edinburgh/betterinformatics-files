import React, { useMemo, useState } from "react";
import {
  Anchor,
  Button,
  Group,
  LoadingOverlay,
  Select,
  Table,
} from "@mantine/core";
import { useRequest } from "@umijs/hooks";
import { loadCategories, useBICourseList } from "../api/hooks";
import { BICourse, CategoryMetaDataMinimal } from "../interfaces";
import { fetchGet, fetchPost } from "../api/fetch-utils";

const loadEuclidList = async () => {
  return (await fetchGet("/api/category/listeuclidcodes/")).value as {
    code: string;
    category: string;
  }[];
};

const addEuclidCode = async (slug: string, code: string) => {
  await fetchPost(`/api/category/addeuclidcode/${slug}/`, {
    code,
  });
};

interface CourseEuclidAssociateButtonProps {
  code: string;
  onAssociated: () => void;
  categories: CategoryMetaDataMinimal[] | undefined;
}

const CourseEuclidAssociateButton: React.FC<
  CourseEuclidAssociateButtonProps
> = ({ code, onAssociated, categories }) => {
  const [categorySlug, setCategorySlug] = useState<string | undefined>();

  const options = useMemo(
    () =>
      categories?.map(category => ({
        value: category.slug,
        label: category.displayname,
      })) ?? [],
    [categories],
  );

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (categorySlug) {
      console.log(`Associate ${code} with ${categorySlug}`);
      await addEuclidCode(categorySlug, code);
      onAssociated();
    }
  };

  return (
    <>
      <form onSubmit={onSubmit}>
        <Group>
          <Select
            label="Category"
            placeholder="Choose category..."
            searchable
            nothingFound="No category found"
            data={options}
            onChange={(value: string) => setCategorySlug(value)}
            required
          />
          <Button variant="brand" type="submit">
            Associate
          </Button>
        </Group>
      </form>
    </>
  );
};

const CourseMetadataChecker: React.FC = () => {
  const {
    error: categoriesError,
    loading: categoriesLoading,
    data: categories,
  } = useRequest(loadCategories);

  // Course missing check from BetterInformatics courses.json
  const [biError, biLoading, biData] = useBICourseList();
  const {
    error: euclidListError,
    loading: euclidListLoading,
    data: euclidList,
    run: reloadEuclidList,
  } = useRequest(() => loadEuclidList());
  const courseCheckError = biError || euclidListError || categoriesError;
  const courseCheckLoading =
    biLoading || euclidListLoading || categoriesLoading;

  // Create a list of courses that are in the BI data but not in the categories.
  // We don't care about the courses that are in the categories but not in the
  // BI data because that's just the archived past courses that are no longer
  // running, have been renamed, or have been merged/split into other courses.
  const missingMapping = useMemo(() => {
    if (!biData || !euclidList) return [];

    // For each BI course, check if it exists in the categories data and keep
    // track of those missing a corresponding category
    const missingMapping: { code: string; data: BICourse; loading: boolean }[] =
      [];
    for (const biCourse of Object.values(biData)) {
      // Check if the euclid code exists in the categories data
      const euclid = biCourse.euclid_code;
      const euclid_shadow = biCourse.euclid_code_shadow;
      if (!euclidList.find(mapping => mapping.code === euclid)) {
        missingMapping.push({ code: euclid, data: biCourse, loading: false });
      }
      if (
        euclid_shadow &&
        !euclidList.find(mapping => mapping.code === euclid_shadow)
      ) {
        missingMapping.push({
          code: euclid_shadow,
          data: biCourse,
          loading: false,
        });
      }
    }

    return missingMapping;
  }, [biData, euclidList]);

  return (
    <>
      {courseCheckError && <div>{courseCheckError.message}</div>}
      <div>
        {courseCheckLoading && <LoadingOverlay visible={courseCheckLoading} />}
        <Table striped fontSize="md">
          <thead>
            <tr>
              <th>EUCLID Code</th>
              <th>Course Details</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {missingMapping &&
              missingMapping.map(({ code, data, loading }) => (
                <tr key={code}>
                  <td>{code}</td>
                  <td>
                    {data.name}
                    <br />
                    {`${data.delivery} / SCQF ${data.level} / ${data.credits} credits`}
                    <br />
                    <Anchor
                      color="blue"
                      component="a"
                      href={data.euclid_url}
                      target="_blank"
                    >
                      {data.euclid_url}
                    </Anchor>
                  </td>
                  <td>
                    <CourseEuclidAssociateButton
                      code={code}
                      onAssociated={reloadEuclidList}
                      categories={categories}
                    />
                  </td>
                </tr>
              ))}
          </tbody>
        </Table>
      </div>
    </>
  );
};

export default CourseMetadataChecker;
