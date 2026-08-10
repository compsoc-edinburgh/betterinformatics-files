import React from "react";
import {
  Container,
  Text,
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

const GuidePage: React.FC = () => {
  const { slug } = useParams() as { slug?: string };
  const { data: page, isError } = useGetPage(slug ?? "year1");
  const { data: pages } = useListPages({ child_of: "", category: "" });
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
              justify="flex-start"
            >
              Create New Page
            </Button>
          </Stack>
          {page ? (
            <PageArticle page={page} parentPages={parentPages} />
          ) : (
            <div />
          )}
        </Flex>
      </Container>
    </>
  );
};

export default GuidePage;
