import React from "react";
import { Container, Text, Flex } from "@mantine/core";
import { useDeletePage, useGetPage, useListPages } from "../api/hooks/pages";
import { useNavigate, useParams } from "react-router";
import { PageArticle } from "../components/page-article";
import { GuideSideBarLeft } from "../components/guide-sidebar-left";

const GuidePage: React.FC = () => {
  const { slug } = useParams() as { slug?: string };
  const { data: pages, refetch: refetchPages } = useListPages({
    category: "",
  });
  const {
    data: page,
    isError,
    refetch,
  } = useGetPage(slug ?? pages?.pages[0]?.slug ?? "", {
    query: {
      enabled: !!slug || !!pages?.pages.length,
    },
  });
  const parentPages =
    pages?.pages.filter(p => page?.parents.includes(p.slug)) ?? [];

  const navigate = useNavigate();

  const { mutate: deletePage } = useDeletePage({
    mutation: {
      onSuccess: () => {
        // Redirect to top guide
        void navigate("/guide");
      },
    },
  });

  if (isError) {
    return (
      <Container size="xl">
        <Text>Error loading page</Text>
      </Container>
    );
  }

  return (
    <Container size="xl" flex={1}>
      <Flex
        direction={{ base: "column", sm: "row" }}
        justify="space-between"
        align="flex-start"
        gap="xs"
      >
        <GuideSideBarLeft />
        {page && pages ? (
          <PageArticle
            key={page.slug}
            page={page}
            pages={pages}
            parentPages={parentPages}
            refetch={() => {
              void refetch();
              void refetchPages();
            }}
            onDelete={() => {
              deletePage({ slug: page.slug });
              void refetchPages();
            }}
          />
        ) : (
          <div />
        )}
      </Flex>
    </Container>
  );
};

export default GuidePage;
