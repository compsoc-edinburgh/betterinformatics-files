import React from "react";
import { Container, Text } from "@mantine/core";
import { useGetPage } from "../api/hooks/pages";
import { useParams } from "react-router";
import { PageArticleHistory } from "../components/page-article-history";

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

  return page ? <PageArticleHistory key={page.slug} page={page} /> : <div />;
};

export default GuideHistoryPage;
