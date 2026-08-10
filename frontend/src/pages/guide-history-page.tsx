import React from "react";
import { Container, Text, Flex } from "@mantine/core";
import { useGetPage } from "../api/hooks/pages";
import { useParams } from "react-router";
import { PageArticleHistory } from "../components/page-article-history";
import { GuideSideBarLeft } from "../components/guide-sidebar-left";

const GuideHistoryPage: React.FC = () => {
  const { slug } = useParams() as { slug: string };
  const { data: page, isError } = useGetPage(slug);

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
        {page ? <PageArticleHistory key={page.slug} page={page} /> : <div />}
      </Flex>
    </Container>
  );
};

export default GuideHistoryPage;
