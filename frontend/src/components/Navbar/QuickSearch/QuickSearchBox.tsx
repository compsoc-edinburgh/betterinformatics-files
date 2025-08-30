import { getHotkeyHandler, useDisclosure, useHotkeys, useMediaQuery } from "@mantine/hooks";
import { Modal, Button, Group, Text, TextInput, Combobox, InputBase, useCombobox, Kbd, Divider, Stack, Badge } from "@mantine/core";
import { useDebounce, useRequest } from "@umijs/hooks";
import { loadCategories, loadSearch } from "../../../api/hooks";
import { IconChevronDown, IconSearch } from "@tabler/icons-react";
import useSearch from "../../../hooks/useSearch";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { highlight } from "../../../utils/search-utils";
import { HighlightedContent } from "../../HighlightSearchHeadline";
import MarkdownText from "../../markdown-text";
import { escapeRegExp } from "lodash-es";
import classes from "./QuickSearchBox.module.css";
import clsx from "clsx";
import { ExamSearchResult } from "../../../interfaces";
import useCategorisedNavigation from "../../../hooks/useCategorisedNavigation";
import { QuickSearchResult } from "./QuickSearchResult";

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

const displayOrder = ["categories", "examNames", "examPages", "answers", "comments"] as const;

export const QuickSearchBox: React.FC = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const categories = useRequest(loadCategories, {
    cacheKey: "categories",
  });
  const isMobile = useMediaQuery('(max-width: 50em)');

  // Search query and its debounced version (to save network requests while typing)
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 150);

  // Category filter, set by pages like ExamPage or CategoryPage through the
  // global context (in App). Undefined if there is no filter.
  const { filter: contextFilter } = useContext(QuickSearchFilterContext) ?? {};

  // Whether we use global search or category search. If using category search,
  // we'll use contextFilter for the slug and display name. isGlobal should
  // never be set to false if contextFilter is undefined.
  const [isGlobal, setIsGlobal] = useState<boolean>(contextFilter === undefined);

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

  const searchResults = useRequest(() => loadSearch(debouncedSearchQuery, isGlobal ? undefined : contextFilter?.slug, true), {
    refreshDeps: [debouncedSearchQuery, isGlobal],
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
  const results = {
    categories: categoryResults,
    examNames,
    examPages,
    answers,
    comments,
  };

  const { moveUp, moveDown, currentSelection } = useCategorisedNavigation(results, displayOrder);

  useHotkeys([
    // Slash to open wherever this component is mounted (i.e. everywhere if QuickSearchBox is in nav bar)
    ['/', open],
    // Modal component has built-in support for esc to close
  ], []);

  // Everywhere vs category-local dropdown store
  const combobox = useCombobox();

  return (
    <>
      <Button className={classes.navButton} px="md" onClick={open}>
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
            onOptionSubmit={(val) => {
              setIsGlobal(val === "global");
              combobox.closeDropdown();
            }}
            classNames={{
              option: classes.dropdownOption,
            }}
          >
            <Combobox.Target>
              <InputBase
                component="button"
                type="button"
                pointer
                rightSection={<IconChevronDown />}
                rightSectionPointerEvents="none"
                onClick={() => combobox.toggleDropdown()}
                size="md"
                classNames={{ input: classes.dropdownInput }}
              >
                {isGlobal ? "Everywhere" : contextFilter?.displayname}
              </InputBase>
            </Combobox.Target>
            <Combobox.Dropdown>
              <Combobox.Options>
                <Combobox.Option value="global">Everywhere</Combobox.Option>
                {/*Display the category-based filter only if there is one defined
                   by the page (via the React context)*/ contextFilter && (
                  <Combobox.Option value="local">
                    {contextFilter.displayname}
                  </Combobox.Option>
                )}
              </Combobox.Options>
            </Combobox.Dropdown>
          </Combobox>
          <TextInput
            classNames={{
              root: classes.searchInputWrapper,
              input: classes.searchInput,
            }}
            data-autofocus
            placeholder="Search..."
            size="md"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
            onKeyDown={getHotkeyHandler([
              ["ArrowUp", moveUp],
              ["ArrowDown", moveDown],
            ])}
          />
        </Group>
        {searchQuery.length === 0 && <Text c="dimmed" my="xs" ta="center">Start typing to search...</Text>}
        {searchQuery.length > 0 && (
          <Stack my="xs" gap={0}>
            {results.categories.length > 0 && (
              <>
                <Divider variant="dashed" label="Categories" labelPosition="left"/>
                {results.categories.map((category, i) => {
                  const isSelected = currentSelection.type === "categories" && currentSelection.index === i;
                  return (
                    <QuickSearchResult badge="Category" isSelected={isSelected} key={category.slug}>
                      <Text>{highlight(category.displayname, category.match)}</Text>
                    </QuickSearchResult>
                  )
                })}
              </>
            )}
            {!searchResults.loading && searchResults.error && <Text c="dimmed" mx="auto">{String(searchResults.error)}</Text>}
            {results.examNames.length > 0 && (
              <>
                <Divider variant="dashed" label="Exams" labelPosition="left" />
                {results.examNames.map((exam, i) => {
                  const isSelected = currentSelection.type === "examNames" && currentSelection.index === i;
                  return (
                    <QuickSearchResult badge="Exam" isSelected={isSelected} key={exam.filename}>
                      <Text>
                        {exam.headline.map((part, i) => (
                          <HighlightedContent content={part} key={i} />
                        ))}
                      </Text>
                    </QuickSearchResult>
                  )
                })}
              </>
            )}
            {results.examPages.length > 0 && (
              <>
                <Divider variant="dashed" label="Exam Pages" labelPosition="left" />
                {results.examPages.map((exam, i) => {
                  const isSelected = currentSelection.type === "examPages" && currentSelection.index === i;
                  return (
                    <QuickSearchResult badge="Exam Page" isSelected={isSelected} key={exam.filename}>
                      <Stack>
                        <Text>
                          {exam.headline.map((part, i) => (
                            <HighlightedContent content={part} key={i} />
                          ))} - Page {exam.pages[0][0]}
                        </Text>
                        <Text c="gray">
                          ...
                          {exam.pages[0][2].map((part, i) => (
                            <HighlightedContent content={part} key={i} />
                          ))}
                          ...
                        </Text>
                      </Stack>
                    </QuickSearchResult>
                  )
                })}
              </>
            )}
            {results.answers.length > 0 && (
              <>
                <Divider variant="dashed" label="Answers" labelPosition="left" />
                {results.answers.map((answer, i) => {
                  const isSelected = currentSelection.type === "answers" && currentSelection.index === i;
                  return (
                    <QuickSearchResult badge="Answer" isSelected={isSelected} key={answer.long_id}>
                      <MarkdownText value={answer.text} regex={new RegExp(`${answer.highlighted_words.map(escapeRegExp).join("|")}`)} />
                    </QuickSearchResult>
                  )
                })}
              </>
            )}
            {results.comments.length > 0 && (
              <>
                <Divider variant="dashed" label="Comments" labelPosition="left" />
                {results.comments.map((comment, i) => {
                  const isSelected = currentSelection.type === "comments" && currentSelection.index === i;
                  return (
                    <QuickSearchResult badge="Comment" isSelected={isSelected} key={comment.long_id}>
                      <MarkdownText value={comment.text} regex={new RegExp(`${comment.highlighted_words.map(escapeRegExp).join("|")}`)} />
                    </QuickSearchResult>
                  )
                })}
              </>
            )}
          </Stack>
        )}
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

export interface QuickSearchFilter {
  slug: string, // Category slug
  displayname: string; // Category display name
};

// Provide React Contexts so components across the app can call
// useQuickSearchFilter({slug, displayname});
export const QuickSearchFilterContext = createContext<{
  filter?: QuickSearchFilter,
  setFilter: (filter?: QuickSearchFilter) => void,
} | undefined>(undefined);

/**
 * Set the category filter for the site-wide quick search bar.
 * When the component that calls the hook gets unloaded, the filter is reverted
 * back to undefined, regardless of whatever value it was set to by any parent
 * before you called the hook.
 * @param slug Must be a valid category slug, passed to the backend to filter
 * quick-search results
 * @param displayname Used in UI to show the dropdown text in the quick-search bar
 */
export const useQuickSearchFilter = (filter?: QuickSearchFilter) => {
  const { filter: currentFilter, setFilter } = useContext(QuickSearchFilterContext) ?? {};
  useEffect(() => {
    // Context may be undefined if there is no QuickSearchFilterContext in
    // the parent tree. If so, we won't do anything nor return cleanups.
    if (!setFilter) return;

    // Prevent re-renders caused by passing a new object if the child values are
    // the same. Otherwise, since the object passed to this hook is newly created
    // every render, useEffect will trigger, setFilter will trigger, re-render
    // is triggered by context value changing, which causes useEffect to trigger
    // etc...
    // The fix is to stop the recursion if our desired result is already set
    if (filter?.slug === currentFilter?.slug) return;

    setFilter(filter);
    return () => {
      // Cleanup function that runs whenever deps list changes or component
      // unloads. We have to do a check here as well that the desired state is
      // not the current state, otherwise there will be an infinite loop where
      // setFilter(undefined) will cause a context re-render, which will cause
      // the hook to be unloaded, which calls useEffect's return callback, which
      // sets setFilter(undefined) again.
      if (currentFilter !== undefined) setFilter(undefined);
    }
  }, [currentFilter, filter, setFilter]);
}
