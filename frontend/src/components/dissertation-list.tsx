import React, { useMemo, useState } from "react";
import {
  Text,
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
import { useListDissertations } from "../api/hooks/dissertations";
import {
  ResourceList,
  ResourceListEmptyRow,
  ResourceListHeader,
  ResourceListRow,
  ResourceListTitle,
} from "./resource-list";

interface Props {
  slug?: string;
  disableSearch?: boolean;
  flush?: boolean;
  withHeader?: boolean;
  showRelevance?: boolean;
}

const EmptySection: React.FC<{ flush?: boolean }> = ({ flush }) => {
  return (
    <ResourceList columns="1fr" flush={flush}>
      <ResourceListEmptyRow>
        No relevant dissertations found :(
      </ResourceListEmptyRow>
    </ResourceList>
  );
};

export const DissertationList: React.FC<Props> = ({
  slug,
  disableSearch,
  flush = false,
  withHeader = true,
  showRelevance = true,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery] = useDebouncedValue(searchQuery, 300);
  const [searchField, setSearchField] = useState<string | null>("title");

  const {
    data: dissertations,
    isFetching,
    isError,
    error,
  } = useListDissertations(
    {
      query: debouncedSearchQuery,
      field: searchField ?? "",
      category: slug,
    },
    {
      query: {
        select({ value: document }) {
          return document;
        },
      },
    },
  );

  // Show larger loading indicator only if it's taking a while - otherwise it's
  // a bit too annoying. there already is a small spinner in the search box.
  const [loadingDebounced] = useDebouncedValue(isFetching, 500);
  const rows = useMemo(() => {
    return dissertations
      ? dissertations.map(dissertation => (
          <ResourceListRow key={dissertation.id}>
            <ResourceListTitle direction="column">
              <Anchor
                h="100%"
                display="block"
                component={Link}
                to={`/dissertations/${dissertation.id}`}
              >
                <Text>{dissertation.title}</Text>
              </Anchor>
              <Text size="sm" c="dimmed">
                {dissertation.year} {dissertation.study_level} Dissertation
              </Text>
            </ResourceListTitle>
            {showRelevance && (
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
            )}
            <Stack gap={0}>
              {dissertation.supervisors.split(",").map((supervisor, index) => (
                <Text fz="sm" key={index}>
                  {supervisor.trim()}
                </Text>
              ))}
            </Stack>
          </ResourceListRow>
        ))
      : [];
  }, [dissertations, showRelevance]);

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
                loadingDebounced ? (
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

      {isError && (
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

        {!loadingDebounced &&
          !isError &&
          (dissertations?.length === 0 ? (
            <EmptySection flush={flush} />
          ) : (
            <ResourceList columns="1fr auto auto" flush={flush}>
              {withHeader && (
                <ResourceListHeader>
                  <Text size="sm">Title</Text>
                  {showRelevance && <Text size="sm">Relevance</Text>}
                  <Text size="sm">Supervisors</Text>
                </ResourceListHeader>
              )}
              {rows}
            </ResourceList>
          ))}
      </div>
    </>
  );
};

export default DissertationList;
