import { useDisclosure, useHotkeys, useMediaQuery } from "@mantine/hooks";
import { Modal, Button, Group, Text, TextInput, Combobox, InputBase, useCombobox, Kbd, Divider, Stack } from "@mantine/core";
import { useRequest } from "@umijs/hooks";
import { loadCategories, loadSearch } from "../../api/hooks";
import { IconChevronDown, IconSearch } from "@tabler/icons-react";
import useSearch from "../../hooks/useSearch";
import { useState } from "react";
import { highlight } from "../../utils/search-utils";

export const SearchBar: React.FC = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const categories = useRequest(loadCategories, {
    cacheKey: "categories",
  });
  const isMobile = useMediaQuery('(max-width: 50em)');

  const [searchQuery, setSearchQuery] = useState("");

  const categoryResults = useSearch(
    categories.data ?? [],
    searchQuery,
    Math.min(searchQuery.length * 2, 12),
    (data) => data.displayname,
  );

  const searchResults = useRequest(() => loadSearch(searchQuery), {
    refreshDeps: [searchQuery],
  });
  const exams = searchResults.data?.filter((result) => result.type === "exam") ?? [];
  const answers = searchResults.data?.filter((result) => result.type === "answer") ?? [];
  const comments = searchResults.data?.filter((result) => result.type === "comment") ?? [];

  const combobox = useCombobox();

  useHotkeys([
    // Slash to open wherever this component is mounted (i.e. everywhere if searchbar is in nav bar)
    ['/', open],
    // Modal component has built-in support for esc to close
  ]);

  return (
    <>
      <Button bg="gray.3" style={{ overflow: "visible" }} px="md" onClick={open}>
        <Group wrap="nowrap">
          <IconSearch />
          <span>Search</span>
          <Kbd>/</Kbd>
        </Group>
      </Button>
      <Modal
        size="82.5rem"
        opened={opened}
        onClose={close}
        withCloseButton={isMobile}
        fullScreen={isMobile}
        transitionProps={{ transition: "pop", duration: 50 }}
        // The height of top nav
        yOffset="3.5rem"
        padding="xs"
      >
        <Group wrap="nowrap" gap={0} preventGrowOverflow={false}>
          <Combobox
            store={combobox}
            offset={0}
          >
            <Combobox.Target>
              <InputBase
                component="button"
                type="button"
                pointer
                rightSection={<IconChevronDown />}
                rightSectionPointerEvents="none"
                onClick={() => combobox.toggleDropdown()}
                maw={300}
                size="md"
                styles={{input: { textOverflow: "ellipsis", textWrap: "nowrap", overflow: "hidden", borderStartEndRadius: 0, borderEndEndRadius: 0, background: "var(--mantine-color-gray-2)", borderColor: "var(--mantine-color-gray-2)" } }}
              >
                Foundations of Algorithmic Data Science
              </InputBase>
            </Combobox.Target>
            <Combobox.Dropdown>
              <Combobox.Options>
                <Combobox.Option value="global">Everywhere</Combobox.Option>
                <Combobox.Option value="local">Foundations of Algorithmic Data Science</Combobox.Option>
              </Combobox.Options>
            </Combobox.Dropdown>
          </Combobox>
          <TextInput
            styles={{ input: {
              borderStartStartRadius: 0,
              borderEndStartRadius: 0,
              borderLeft: 0,
              background: "var(--mantine-color-gray-3)",
              borderColor: "var(--mantine-color-gray-3)",
            } }}
            style={{ flexGrow: 1 }}
            data-autofocus
            placeholder="Search..."
            size="md"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
          />
        </Group>
        <Stack my="xs">
          {searchQuery.length === 0 && <Text c="dimmed" mx="auto">Start typing to search...</Text>}
          {searchQuery.length > 0 && categoryResults.length > 0 && (
            <>
              <Divider variant="dashed" />
              {categoryResults.slice(0, 4).map((category) => (
                <Text key={category.slug}>{highlight(category.displayname, category.match)}</Text>
              ))}
            </>
          )}
          {searchQuery.length > 0 && exams.length > 0 && (
            <>
              <Divider variant="dashed" />
              {exams.slice(0, 4).map((exam) => (
                <Text key={exam.filename}>
                  {exam.headline.map((part, i) => (
                    <mark key={i}>{part} {part.toString()}</mark>
                  ))}
                </Text>
              ))}
            </>
          )}
        </Stack>
        <Divider style={{ marginInline: 'calc(-1 * var(--mb-padding))' }} my="xs" />
        <Group justify="flex-end">
          <Group gap="xs">
            <Kbd size="xs">↑</Kbd>
            <Kbd size="xs">↓</Kbd>
            <Text>to navigate</Text>
          </Group>
          <Group gap="xs">
            <Kbd size="xs">Enter</Kbd>
            <Text>to confirm</Text>
          </Group>
          <Group gap="xs">
            <Kbd size="xs">Esc</Kbd>
            <Text>to exit</Text>
          </Group>
        </Group>
      </Modal>
    </>
  );
};
