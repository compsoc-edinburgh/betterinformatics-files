import React, { useMemo, useState } from "react";
import { useDissertations } from "../api/hooks";
import {
  Text,
  Table,
  TextInput,
  Group,
  Anchor,
  Loader,
  CloseButton,
  Select,
  Space,
  Collapse,
  Progress,
  Notification,
  Stack,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useDebouncedValue } from "@mantine/hooks";
import { Link } from "react-router-dom";

interface Props {
  slug?: string;
  disableSearch?: boolean;
}

export const DissertationList: React.FC<Props> = ({ slug, disableSearch }) => {
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
            <Table.Td height="1px">
              <Anchor
                h="100%"
                display="block"
                component={Link}
                to={`/dissertations/${dissertation.id}`}
              >
                <Text>{dissertation.title}</Text>
                <Text size="sm" c="dimmed">
                  {dissertation.year} {dissertation.study_level} Dissertation
                </Text>
              </Anchor>
            </Table.Td>
            <Table.Td valign="top">
              <Stack gap={0} align="flex-start">
                {dissertation.relevant_categories.map((category, index) => (
                  <Text fz="sm" key={index}>
                    Course:{" "}
                    <Anchor
                      fz="sm"
                      c="blue"
                      component={Link}
                      to={`/category/${category.slug}`}
                    >
                      {category.displayname}
                    </Anchor>
                  </Text>
                ))}
                <Text fz="sm">
                  Tags:{" "}
                  {dissertation.field_of_study
                    .split(",")
                    .map(t => t.trim())
                    .join(", ")}
                </Text>
              </Stack>
            </Table.Td>
            <Table.Td valign="top">
              {dissertation.supervisors.split(",").map((supervisor, index) => (
                <Text fz="sm" key={index}>
                  {supervisor.trim()}
                </Text>
              ))}
            </Table.Td>
          </Table.Tr>
        ))
      : [];
  }, [dissertations]);

  return (
    <>
      {!disableSearch && (
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
                { value: "field_of_study", label: "Topic" },
                { value: "supervisors", label: "Supervisors" },
                { value: "year", label: "Year" },
              ]}
              clearable
            />
          </Group>
          <Space h="md" />
        </>
      )}

      {error && (
        <Notification title="Error" color="red">
          {String(error)}
        </Notification>
      )}

      <div style={{ position: "relative" }}>
        <Collapse
          expanded={loadingDebounced}
          style={{ position: "absolute", top: 0, left: 0, right: 0 }}
        >
          <Progress value={100} animated striped />
        </Collapse>

        {!loading &&
          !error &&
          (dissertations?.length === 0 ? (
            <Text>No dissertations found. :(</Text>
          ) : (
            <Table
              style={{ backgroundColor: "var(--mantine-color-body)" }}
              striped={false}
              highlightOnHover={false}
              withTableBorder
              withColumnBorders
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Title</Table.Th>
                  <Table.Th w="320">Relevance</Table.Th>
                  <Table.Th w="160">Supervisors</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
            </Table>
          ))}
      </div>
    </>
  );
};

export default DissertationList;
