import React from "react";
import {
  Container,
  Text,
  Paper,
  Flex,
  Stack,
  Anchor,
  Button,
  Divider,
} from "@mantine/core";
import { IconSquarePlus } from "@tabler/icons-react";
import { useGetPage, useListPages } from "../api/hooks/pages";
import { Link, useParams } from "react-router";
import { PageArticle } from "../components/page-article";
import { GuideSidebarRight } from "../components/guide-sidebar-right";
import { useTableOfContents } from "../hooks/useTableOfContents";

const GuidePage: React.FC = () => {
  const { slug } = useParams() as { slug?: string };
  const { data: page, isError } = useGetPage(slug ?? "year1");
  const { data: pages } = useListPages({ child_of: "", category: "" });
  const toc = useTableOfContents(page?.content ?? "");
  const parentPages =
    pages?.pages.filter(p => page?.parents.includes(p.slug)) ?? [];

  if (isError) {
    return (
      <Container size="xl">
        <Text>Error loading page</Text>
      </Container>
    );
  }

  return (
    <>
      <Container size="xl" flex={1}>
        <Flex
          direction={{ base: "column", sm: "row" }}
          justify="space-between"
          align="flex-start"
          gap="xs"
        >
          <Stack gap="xs" style={{ minWidth: "200px" }}>
            <Paper shadow="none" p="md">
              {pages?.pages.map(p => (
                <Anchor
                  display="block"
                  key={p.slug}
                  to={`/guide/${p.slug}`}
                  component={Link}
                >
                  {p.title}
                </Anchor>
              ))}
              <Divider my="md" />
              <Button
                component={Link}
                to={`/guide/new`}
                size="compact-sm"
                variant="subtle"
                leftSection={<IconSquarePlus size={16} />}
              >
                Create New Page
              </Button>
            </Paper>
          </Stack>
          {page ? <PageArticle page={page} /> : <div />}
          <GuideSidebarRight toc={toc} parentPages={parentPages} />
        </Flex>
      </Container>
    </>
  );
};

export default GuidePage;
