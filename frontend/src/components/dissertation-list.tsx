import React, { useMemo, useState } from "react";
import { useDissertations } from "../api/hooks";
import {
  Title,
  Text,
  Table,
  TextInput,
  Group,
  Anchor,
  Badge,
  Loader,
  CloseButton,
  Select,
  Space,
  Collapse,
  Progress,
  Notification,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useDebouncedValue } from "@mantine/hooks";
import { Link } from "react-router-dom";

interface Props {
  slug?: string;
}

export const DissertationList: React.FC<Props> = ({ slug }) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery] = useDebouncedValue(searchQuery, 300);
  const [searchField, setSearchField] = useState<string | null>("title");

  const {
    error,
    loading,
    data: dissertations,
  } = useDissertations(debouncedSearchQuery, searchField ?? "", slug);

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
    <>
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
    </>
  );
};

export const DissertationListWrapper: React.FC<Props> = ({ slug }) => {
  return (
    <>
      <Title order={2} mb="md">
        Relevant Dissertations
      </Title>
      <Text opacity={0.7} mb="md" size="sm">
        Did you enjoy the contents of this course? You can check out
        dissertations that have worked on related topics, which might help in
        finding a dissertation topic or understanding what kind of work is being
        done in this area.
      </Text>
      <DissertationList slug={slug} />
    </>
  );
};

export default DissertationListWrapper;
