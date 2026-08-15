import { useRequest } from "ahooks";
import React, { useState } from "react";
import { loadCategories, useBICourseList } from "../api/hooks";
import { useListPages, useUpdatePage } from "../api/hooks/pages";
import {
  Anchor,
  Button,
  Group,
  LoadingOverlay,
  MultiSelect,
  Table,
} from "@mantine/core";
import { PageListResponse, PageListResponseItem } from "../api/model";
import { fetchGet } from "../api/fetch-utils";
import { Link } from "react-router-dom";

interface CategoryParentSetButtonProps {
  page: PageListResponseItem;
  pages: PageListResponse;
  onSubmit: (parents: string[]) => void;
}
const CategoryParentSetButton: React.FC<CategoryParentSetButtonProps> = ({
  page,
  onSubmit,
  pages,
}) => {
  const [parents, setParents] = useState<string[]>(page.parents);

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        onSubmit(parents);
      }}
    >
      <Group align="end">
        <MultiSelect
          label="Parent Pages"
          data={pages.pages
            .filter(p => p.category === null)
            .filter(p => p.slug !== page.slug)
            .map(p => ({ value: p.slug, label: p.title }))}
          value={parents}
          onChange={value => setParents(value)}
          style={{ flex: 1 }}
        />
        <Button variant="outline" type="submit" color="dark">
          Associate
        </Button>
      </Group>
    </form>
  );
};

const loadEuclidList = async () => {
  return (await fetchGet("/api/category/listeuclidcodes/")).value as {
    code: string;
    category: string;
  }[];
};

export const CategoryGuideParentChecker: React.FC = () => {
  const {
    error: categoriesError,
    loading: categoriesLoading,
    data: categories,
  } = useRequest(loadCategories);

  // Pages with no parents
  const {
    data: pagesWithNoParents,
    error: pagesError,
    isLoading: pagesLoading,
    refetch: refetch,
  } = useListPages({
    child_of: "",
  });

  const {
    error: euclidListError,
    loading: euclidListLoading,
    data: euclidList,
  } = useRequest(() => loadEuclidList());

  const [biErr, biLoading, biData] = useBICourseList();

  const categoriesWithGuideNoParent = React.useMemo(() => {
    if (!categories || !pagesWithNoParents || !biData || !euclidList) return [];

    return pagesWithNoParents.pages
      .map(page => {
        const category = categories.find(c => c.slug === page.category?.slug);
        const euclid_codes = euclidList
          .filter(e => e.category === category?.slug)
          .map(e => e.code);
        const biCourse = Object.values(biData.list).find(c =>
          euclid_codes.includes(c.euclid_code),
        );

        if (!category) return null;
        return {
          page,
          category,
          biCourse,
        };
      })
      .filter(i => i !== null);
  }, [categories, pagesWithNoParents, biData, euclidList]);

  const error =
    categoriesError?.message ??
    pagesError?.err ??
    euclidListError?.message ??
    biErr?.message;

  const { mutate: updatePage } = useUpdatePage({
    mutation: {
      onSuccess: async () => await refetch(),
    },
  });

  if (error) {
    return <div>{error}</div>;
  }

  if (categoriesWithGuideNoParent.length === 0) {
    return <div>All categories with guides have parent pages.</div>;
  }

  return (
    <>
      <LoadingOverlay
        visible={
          categoriesLoading || pagesLoading || euclidListLoading || biLoading
        }
      />
      <Table fz="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Category Details</Table.Th>
            <Table.Th w={600}>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {categoriesWithGuideNoParent.map(({ page, category, biCourse }) => (
            <Table.Tr key={page.slug}>
              <Table.Td>
                <Anchor component={Link} to={`/category/${category.slug}`}>
                  {category.displayname}
                </Anchor>
                <br />
                {biCourse ? (
                  <>
                    {biCourse.name} / Year {biCourse.year}
                  </>
                ) : (
                  <i>Metadata not found on external course list</i>
                )}
              </Table.Td>
              <Table.Td>
                {pagesWithNoParents && (
                  <CategoryParentSetButton
                    page={page}
                    pages={pagesWithNoParents}
                    onSubmit={parents =>
                      updatePage({
                        slug: page.slug,
                        data: {
                          slug: page.slug,
                          category: page.category?.slug ?? null,
                          parents,
                          revision_message: "Set parent page",
                          is_anonymous: false,
                          title: null,
                          content: null,
                        },
                      })
                    }
                  />
                )}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </>
  );
};
