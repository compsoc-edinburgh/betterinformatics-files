import React from "react";
import {
  Container,
  Title,
  Text,
  Paper,
  Flex,
  Stack,
  Group,
  Anchor,
  Button,
  Divider,
} from "@mantine/core";
import { IconMenu3, IconPencil, IconSquarePlus } from "@tabler/icons-react";
import { useGetPage, useListPages } from "../api/hooks/pages";
import { Link, useParams } from "react-router";
import { useTableOfContents } from "../hooks/useTableOfContents";
import { PageArticle } from "../components/page-article";

const GuidePage: React.FC = () => {
  const { slug } = useParams() as { slug?: string };
  const { data: page, isError } = useGetPage(slug ?? "year1");
  const { data: pages } = useListPages({ child_of: "", category: "" });
  const toc = useTableOfContents(page?.content ?? "");

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
          <Stack gap="xs" style={{ minWidth: "200px" }}>
            <Paper shadow="none" p="md">
              <Group gap="xs" mb="md">
                <IconPencil size={16} />
                <Title
                  order={2}
                  fz="h6"
                  style={{ textTransform: "uppercase" }}
                  opacity={0.8}
                >
                  Admin
                </Title>
              </Group>
              <Button size="compact-sm" variant="outline">
                Edit
              </Button>
              <Group gap="xs" my="md">
                <IconMenu3 size={16} />
                <Title
                  order={2}
                  fz="h6"
                  style={{ textTransform: "uppercase" }}
                  opacity={0.8}
                >
                  On This Page
                </Title>
              </Group>
              {toc.map(({ level, text, slug }) => (
                <Anchor
                  display="block"
                  key={slug}
                  href={`#${slug}`}
                  style={{ marginLeft: `${(level - 1) * 10}px` }}
                >
                  {text}
                </Anchor>
              ))}
              {page && page.parents.length > 0 && (
                <>
                  <Group gap="xs" mb="md">
                    <IconMenu3 size={16} />
                    <Title
                      order={2}
                      fz="h6"
                      style={{ textTransform: "uppercase" }}
                      opacity={0.8}
                    >
                      Parent Pages
                    </Title>
                  </Group>
                  {page.parents.map(slug => (
                    <Anchor display="block" key={slug} href={`#${slug}`}>
                      {pages?.pages.find(p => p.slug === slug)?.title ?? slug}
                    </Anchor>
                  ))}
                </>
              )}
            </Paper>
          </Stack>
        </Flex>
      </Container>
    </>
  );
};

export default GuidePage;
