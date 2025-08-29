import { useDisclosure, useHotkeys, useMediaQuery } from "@mantine/hooks";
import { Modal, Button, Group, Text, TextInput, Combobox, InputBase, useCombobox, Kbd, Divider, Stack, Badge } from "@mantine/core";
import { useDebounce, useRequest } from "@umijs/hooks";
import { loadCategories, loadSearch } from "../../api/hooks";
import { IconChevronDown, IconSearch } from "@tabler/icons-react";
import useSearch from "../../hooks/useSearch";
import { useState } from "react";
import { highlight } from "../../utils/search-utils";
import { HighlightedContent } from "../HighlightSearchHeadline";
import MarkdownText from "../markdown-text";
import { escapeRegExp } from "lodash-es";
import classes from "./SearchBar.module.css";
import clsx from "clsx";
import { ExamSearchResult } from "../../interfaces";

/**
 * Return the max depth of an array.
 * maxdepth(["a"]) === 1
 * maxdepth([]) === 1
 * maxdepth([["a", ["b"]]]) === 3
 * @param nested_array Arrays with children of arbitrary array depth
 * @returns Max depth
 */
const maxdepth = (nested_array: any): number => {
  if (nested_array instanceof Array) {
    return Math.max(...nested_array.map(maxdepth)) + 1;
  }
  return 0;
}

export const SearchBar: React.FC = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const categories = useRequest(loadCategories, {
    cacheKey: "categories",
  });
  const isMobile = useMediaQuery('(max-width: 50em)');

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 150);

  const categoryResults = useSearch(
    categories.data ?? [],
    searchQuery,
    // We only really want to show almost-perfect matches for this component.
    // So the max error score we allow is 4 -- this value was found by trial and
    // error, I'm not sure I understand the exact meaning of this value. - yuto
    // It doesn't seem to be levenstein distance. If anyone figures it out,
    // please amend this comment!
    4,
    (data) => data.displayname,
  ).slice(0, 4);

  const searchResults = useRequest(() => loadSearch(debouncedSearchQuery, undefined, true), {
    refreshDeps: [debouncedSearchQuery],
  });

  const exams = searchResults.data?.filter((result) => result.type === "exam") ?? [];
  // Results on exam names will have a depth 3 match somewhere in the headline
  const examNames = exams.filter(result => maxdepth(result.headline) !== 2).slice(0, 4) ?? [];
  // Results for exam pages will have non-zero page array.
  // We limit the "number of pages" to 4 (instead of the number of exams, which
  // may each have arbitrary matching result pages). To do this, we use .reduce()
  // and keep adding to a list a copy of the exam with just 1 page, until the
  // total reaches 4.
  const examPages = exams.filter(result => result.pages.length > 0)
    .reduce((accum, exam) => {
      exam.pages.forEach(page => {
        if (accum.totalPages >= 4) return;
        // Clone exam, and set the pages array to just this page/
        // structuredClone is deep-clone and is widely available in modern browsers
        const copyExam = structuredClone(exam);
        copyExam.pages = [page];
        accum.exams.push(copyExam);
        accum.totalPages += 1;
      });
      return accum;
    }, {
      totalPages: 0,
      exams: [] as ExamSearchResult[],
    }).exams ?? [];
  // We might miss some exam results if postgres found a match in the exam name
  // but ts_headline for some reason didn't decide to highlight it. But that is
  // really an edge case so we ignore and won't show it to the user.

  // We'll also limit the number of answers and comments. Lead them to the full
  // search page for more results.
  const answers = searchResults.data?.filter((result) => result.type === "answer").slice(0, 4) ?? [];
  const comments = searchResults.data?.filter((result) => result.type === "comment").slice(0, 4) ?? [];

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
          {!searchResults.loading && searchResults.error && <Text c="dimmed" mx="auto">{String(searchResults.error)}</Text>}
          {searchQuery.length === 0 && <Text c="dimmed" mx="auto">Start typing to search...</Text>}
          {searchQuery.length > 0 && categoryResults.length > 0 && (
            <>
              <Divider variant="dashed" />
              {categoryResults.map((category) => (
                <Group className={classes.searchResult} key={category.slug}>
                  <Text>{highlight(category.displayname, category.match)}</Text>
                  <Badge variant="outline" className={classes.badge}>Category</Badge>
                </Group>
              ))}
            </>
          )}
          {searchQuery.length > 0 && examNames.length > 0 && (
            <>
              <Divider variant="dashed" />
              {examNames.map((exam) => (
                <Group className={classes.searchResult} key={exam.filename}>
                  <Text>
                    {exam.headline.map((part, i) => (
                      <HighlightedContent content={part} key={i} />
                    ))}
                  </Text>
                  <Badge variant="outline" className={classes.badge}>Exam</Badge>
                </Group>
              ))}
            </>
          )}
          {searchQuery.length > 0 && examPages.length > 0 && (
            <>
              <Divider variant="dashed" />
              {examPages.map((exam) => (
                <Stack>
                  <Group className={classes.searchResult} key={exam.filename}>
                    <Text>
                      {exam.headline.map((part, i) => (
                        <HighlightedContent content={part} key={i} />
                      ))} - Page {exam.pages[0][0]}
                    </Text>
                    <Badge variant="outline" className={classes.badge}>Exam Page</Badge>
                  </Group>
                  <Text>
                    ...
                    {exam.pages[0][2].map((part, i) => (
                      <HighlightedContent content={part} key={i} />
                    ))}
                    ...
                  </Text>
                </Stack>
              ))}
            </>
          )}
          {searchQuery.length > 0 && answers.length > 0 && (
            <>
              <Divider variant="dashed" />
              {answers.map((answer) => (
                <Group className={clsx(classes.searchResult, classes.fadeHeightLimited)} key={answer.long_id}>
                  <MarkdownText value={answer.text} regex={new RegExp(`${answer.highlighted_words.map(escapeRegExp).join("|")}`)} />
                  <Badge variant="outline" className={classes.badge}>Answer</Badge>
                </Group>
              ))}
            </>
          )}
          {searchQuery.length > 0 && comments.length > 0 && (
            <>
              <Divider variant="dashed" />
              {comments.map((comment) => (
                <Group className={clsx(classes.searchResult, classes.fadeHeightLimited)} key={comment.long_id}>
                  <MarkdownText value={comment.text} regex={new RegExp(`${comment.highlighted_words.map(escapeRegExp).join("|")}`)} />
                  <Badge variant="outline" className={classes.badge}>Comment</Badge>
                </Group>
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
