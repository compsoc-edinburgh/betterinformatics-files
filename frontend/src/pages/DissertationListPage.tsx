import React, { useMemo, useState } from "react";
import {
  Container,
  Title,
  Text,
  Notification,
  Button,
  TextInput,
  Select,
  Group,
  Table,
  Anchor,
  Badge,
  CloseButton,
  Space,
  Loader,
  Progress,
  Collapse,
} from "@mantine/core";
import { Link } from "react-router-dom";
import { IconUpload, IconSearch } from "@tabler/icons-react";
import { useDebouncedValue } from "@mantine/hooks";
import { useDissertations } from "../api/hooks";

const DissertationListPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery] = useDebouncedValue(searchQuery, 300);
  const [searchField, setSearchField] = useState<string | null>("title");

  const {
    error,
    loading,
    data: dissertations,
  } = useDissertations(debouncedSearchQuery, searchField ?? "");
  // Show larger loading indicator only if it's taking a while - otherwise it's
  // a bit too annoying. there already is a small spinner in the search box.
  const [loadingDebounced] = useDebouncedValue(loading, 500);

  const rows = useMemo(() => {
    return dissertations
      ? dissertations.map(dissertation => (
          <Table.Tr key={dissertation.id}>
            <Table.Td>
              <Anchor
                component={Link}
                to={`/dissertations/${dissertation.id}`}
                style={{ textDecorationLine: "underline", color: "inherit" }}
              >
                {dissertation.title}
              </Anchor>
            </Table.Td>
            <Table.Td>
              <Group gap={4}>
                {dissertation.field_of_study.split(",").map((field, index) => (
                  <Badge key={index} variant="light">
                    {field.trim()}
                  </Badge>
                ))}
              </Group>
            </Table.Td>
            <Table.Td>{dissertation.supervisors}</Table.Td>
            <Table.Td>{dissertation.year}</Table.Td>
            <Table.Td>{dissertation.study_level}</Table.Td>
          </Table.Tr>
        ))
      : [];
  }, [dissertations]);

  return (
    <Container size="xl" mt="xl" style={{ position: "relative" }}>
      <Title order={2} mb="md">
        Dissertation Archive
      </Title>
      <Text>
        The School of Informatics officially maintains{" "}
        <Link to="https://project-archive.inf.ed.ac.uk/">
          an internal archive
        </Link>{" "}
        of all dissertations submitted by students. However, this archive is
        only visible to staff members, and students can only see outstanding
        dissertations of past years. This page provides an alternative public
        archive of dissertations by students who have consented to share their
        work. If you are a student and would like to share your dissertation,
        please use the &ldquo;Upload New Dissertation&rdquo; button below.
      </Text>
      {/* <Space h="md" /><Text>
        In addition, our dissertation archive has nifty features not present in
        the official one, including:
      </Text>
      <List>
        <List.Item>Full-text search to quickly find dissertations.</List.Item>
        <List.Item>
          Linking to relevant courses to encourage students to find potential
          research areas.
        </List.Item>
      </List> */}
      <Button
        mt="md"
        component={Link}
        to="/upload-dissertation"
        style={{ marginBottom: "20px" }}
        leftSection={<IconUpload size={14} />}
      >
        Add My Dissertation
      </Button>

      <Group gap="sm">
        <TextInput
          autoFocus
          placeholder="Search dissertations..."
          value={searchQuery}
          onChange={event => setSearchQuery(event.currentTarget.value)}
          leftSection={<IconSearch size={16} />}
          rightSection={
            loading ? (
              <Loader size="xs" />
            ) : (
              <CloseButton
                onClick={() => setSearchQuery("")}
                style={{ display: searchQuery ? "block" : "none" }}
              />
            )
          }
        />
        <Select
          placeholder="Search by..."
          value={searchField}
          onChange={setSearchField}
          data={[
            { value: "title", label: "Title" },
            { value: "field_of_study", label: "Field of Study" },
            { value: "supervisors", label: "Supervisors" },
            { value: "year", label: "Year" },
          ]}
          clearable
        />
      </Group>
      <Space h="md" />

      {error && (
        <Notification title="Error" color="red">
          {String(error)}
        </Notification>
      )}

      <div style={{ position: "relative" }}>
        <Collapse
          in={loadingDebounced}
          style={{ position: "absolute", top: 0, left: 0, right: 0 }}
        >
          <Progress value={100} animated striped />
        </Collapse>

        {dissertations?.length === 0 && !loading && !error ? (
          <Text ta="center">
            No dissertations found. Be the first to upload one!
          </Text>
        ) : (
          <Table
            striped={false}
            highlightOnHover={false}
            withTableBorder
            withColumnBorders
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Title</Table.Th>
                <Table.Th>Field of Study</Table.Th>
                <Table.Th>Supervisors</Table.Th>
                <Table.Th>Year</Table.Th>
                <Table.Th>Level</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        )}
      </div>
    </Container>
  );
};

export default DissertationListPage;
