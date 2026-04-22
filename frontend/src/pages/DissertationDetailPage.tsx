import React from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  Container,
  Title,
  Text,
  LoadingOverlay,
  Notification,
  Paper,
  Group,
  Badge,
  Table,
  Anchor,
  Breadcrumbs,
  Stack,
  Flex,
} from "@mantine/core";
import { IconChevronRight, IconDownload, IconEdit } from "@tabler/icons-react";
import { useRequest } from "ahooks";
import { loadDissertation, loadDissertationPdf } from "../api/hooks";
import useTitle from "../hooks/useTitle";
import IconButton from "../components/icon-button";
import { useUser } from "../auth";

const DissertationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useUser();

  const {
    loading: dissertationLoading,
    data: dissertation,
    error: dissertationError,
  } = useRequest(() => loadDissertation(Number(id)), {
    refreshDeps: [id],
  });

  const {
    loading: pdfLoading,
    data: pdfUrl,
    error: pdfError,
  } = useRequest(() => loadDissertationPdf(Number(id)), {
    refreshDeps: [id],
  });

  useTitle(dissertation ? dissertation.title : `Dissertation #${id}`);

  if (dissertationLoading || pdfLoading) {
    return (
      <Container
        size="xl"
        mt="xl"
        style={{ position: "relative", minHeight: "300px" }}
      >
        <LoadingOverlay visible={true} />
      </Container>
    );
  }

  if (dissertationError || pdfError) {
    return (
      <Container size="xl" mt="xl">
        <Notification title="Error" color="red">
          {String(dissertationError) || String(pdfError)}
        </Notification>
      </Container>
    );
  }

  if (!dissertation) {
    return (
      <Container size="xl" mt="xl">
        <Notification title="Not Found" color="blue">
          Dissertation not found.
        </Notification>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Breadcrumbs
        mb="sm"
        separator={<IconChevronRight />}
        styles={{
          breadcrumb: {
            minWidth: 0,
            textOverflow: "ellipsis",
            overflow: "hidden",
          },
        }}
      >
        <Anchor tt="uppercase" size="xs" component={Link} to="/">
          Home
        </Anchor>
        <Anchor tt="uppercase" size="xs" component={Link} to="/dissertations">
          Dissertations
        </Anchor>
        <Anchor tt="uppercase" size="xs">
          {dissertation.title}
        </Anchor>
      </Breadcrumbs>

      <Routes>
        <Route
          path="edit"
          element={!user?.isAdmin ? <Navigate to="." replace /> : <h1>hi</h1>}
        />
        <Route
          path="/"
          element={
            <>
              <Flex justify="space-between">
                <Stack gap={0}>
                  <Title order={1}>{dissertation.title}</Title>
                  <Text size="lg" mb="md" c="dimmed">
                    {dissertation.uploaded_by} - {dissertation.year}{" "}
                    {dissertation.study_level} Dissertation
                  </Text>
                </Stack>

                <Group wrap="nowrap">
                  <IconButton
                    color="gray"
                    icon={<IconDownload />}
                    tooltip="Download"
                    onClick={() => window.open(pdfUrl, "_blank")}
                  />
                  {(user?.username === dissertation.uploaded_by ||
                    user?.isAdmin) && (
                    <>
                      <IconButton
                        color="gray"
                        icon={<IconEdit />}
                        tooltip="Edit"
                        onClick={() => navigate("edit")}
                      />
                    </>
                  )}
                </Group>
              </Flex>

              <Table
                layout="fixed"
                variant="vertical"
                verticalSpacing="4px"
                withTableBorder
                mb="xs"
              >
                <Table.Tbody>
                  <Table.Tr>
                    <Table.Th w={160}>Topic Tags</Table.Th>
                    <Table.Td>
                      <Group gap={4}>
                        {dissertation.field_of_study
                          .split(",")
                          .map((field, index) => (
                            <Badge
                              key={index}
                              variant="light"
                              style={{ cursor: "pointer" }}
                            >
                              {field.trim()}
                            </Badge>
                          ))}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Th style={{ verticalAlign: "top" }}>
                      Relevant Courses
                    </Table.Th>
                    <Table.Td>
                      <Stack gap={4} align="flex-start">
                        {dissertation.relevant_categories.map(
                          (category, index) => (
                            <Anchor
                              fz="sm"
                              c="blue"
                              key={index}
                              component={Link}
                              to={`/category/${category.slug}`}
                            >
                              {category.displayname}
                            </Anchor>
                          ),
                        )}
                      </Stack>
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Th>Primary Supervisors</Table.Th>
                    <Table.Td>{dissertation.supervisors}</Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Th>Year Written</Table.Th>
                    <Table.Td>{dissertation.year}</Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Th>Uploaded By</Table.Th>
                    <Table.Td>{dissertation.uploaded_by}</Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Th>Dissertation Level</Table.Th>
                    <Table.Td>{dissertation.study_level}</Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Th>Received Grade Band</Table.Th>
                    {dissertation.grade_band && (
                      <Table.Td>{dissertation.grade_band}</Table.Td>
                    )}
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Th>Additional Notes</Table.Th>
                    {dissertation.notes && (
                      <Table.Td>{dissertation.notes}</Table.Td>
                    )}
                  </Table.Tr>
                </Table.Tbody>
              </Table>

              <Paper shadow="sm" p="sm" withBorder style={{ height: "80vh" }}>
                {pdfUrl ? (
                  <iframe
                    src={pdfUrl}
                    width="100%"
                    height="100%"
                    style={{ border: "none" }}
                    title={dissertation.title}
                  />
                ) : (
                  <Text ta="center" c="red">
                    Failed to load PDF.
                  </Text>
                )}
              </Paper>
            </>
          }
        />
      </Routes>
    </Container>
  );
};

export default DissertationDetailPage;
