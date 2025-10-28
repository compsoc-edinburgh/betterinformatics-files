import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Modal, Button, Group, Text, TextInput, Combobox, InputBase, useCombobox, Kbd, Divider, Stack } from "@mantine/core";
import { getHotkeyHandler, useDisclosure, useHotkeys, useLocalStorage, useMediaQuery } from "@mantine/hooks";
import { useDebounce, useRequest } from "@umijs/hooks";
import { loadAllCategories, loadSearch } from "../../../api/hooks";
import useSearch, { SearchResult as LocalSearchResult } from "../../../hooks/useSearch";
import { AnswerSearchResult, CategoryMetaDataMinimal, CommentSearchResult, ExamSearchResult, SearchResult } from "../../../interfaces";
import useCategorisedNavigation from "../../../hooks/useCategorisedNavigation";
import { IconChevronDown, IconSearch } from "@tabler/icons-react";
import { highlight } from "../../../utils/search-utils";
import { HighlightedContent } from "../../HighlightSearchHeadline";
import MarkdownText from "../../markdown-text";
import { escapeRegExp } from "lodash-es";
import classes from "./QuickSearchBox.module.css";
import { QuickSearchResult } from "./QuickSearchResult";
import { QuickSearchFilterContext } from "./QuickSearchFilterContext";
import { useHistory } from "react-router-dom";

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

/**
 * Determine the path for a search result item so we can navigate to it.
 *
 * @param item A valid search result item from the API, or a locally found category search result.
 * @returns The path to provide to history.push()
 */
const itemToPath = (item: LocalSearchResult<CategoryMetaDataMinimal> | SearchResult | { "searchQuery": string }) => {
  if ("slug" in item) {
    return `/category/${item.slug}`;
  } else if ("searchQuery" in item) {
    return `/search?q=${item.searchQuery}`;
  } else if (item.type === "exam" && item.pages.length > 0) {
    return `/exams/${item.filename}/#page-${item.pages[0][0]}`;
  } else if (item.type === "exam") {
    return `/exams/${item.filename}`;
  } else {
    return `/exams/${item.filename}/#${item.long_id}`;
  }
}

const displayOrder = ["categories", "examNames", "examPages", "answers", "comments", "more"] as const;

export const QuickSearchBox: React.FC = () => {
  const [opened, { open, close }] = useDisclosure(false);

  // Reference to the input element so that we can select all text upon modal open
  const ref = useRef<HTMLInputElement>(null);
  // Variant of `open` that also selects the existing text. Prefer this where
  // possible, it's better UX.
  const openWithHighlight = useCallback(() => {
    open();
    ref.current?.select();
  }, [ref, open]);

  const categories = useRequest(loadAllCategories, {
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
    (isGlobal && categories.data) || [],
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

  // Create a results object, memoised so we don't recreate the same object
  // on every render
  const results = useMemo(() => {
    const exams = searchResults.data?.filter((result): result is ExamSearchResult => result.type === "exam") ?? [];
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
    const answers = searchResults.data?.filter((result): result is AnswerSearchResult => result.type === "answer").slice(0, 4) ?? [];
    const comments = searchResults.data?.filter((result): result is CommentSearchResult => result.type === "comment").slice(0, 4) ?? [];

    return {
      categories: categoryResults,
      examNames,
      examPages,
      answers,
      comments,
      more: [{
        searchQuery: debouncedSearchQuery,
      }],
    }
  }, [categoryResults, searchResults.data, debouncedSearchQuery]);

  const { moveUp, moveDown, currentSelection } = useCategorisedNavigation(results, displayOrder);

  // Create callback for pressing "Enter" and navigating to the highlighted result
  const history = useHistory();
  const confirmSelection = useCallback(() => {
    if (!currentSelection.type) return; // Make sure we don't navivate to invalid selections

    history.push(itemToPath(results[currentSelection.type][currentSelection.index]));
    close();
  }, [currentSelection, history, results, close]);

  useEffect(() => {
    // Do some raw-JS scrollIntoView so that moving up/down via keyboard scrolls
    // items into view if there are many many results. This useEffect handler is
    // triggered right after rendering with the new currentSelection value, so
    // we're guaranteed to have the correct [data-quicksearch-selected]
    // already in the DOM (or not if there is no result).
    document.querySelector("[data-quicksearch-selected=true]")?.scrollIntoView({ block: "center", behavior: "instant" });
  }, [currentSelection]);

const [quickSearchCtrlKEnabled] = useLocalStorage({
  key: "quicksearch-ctrl-k-enabled",
  defaultValue: true,
  getInitialValueInEffect: false,
});

  // Slash to open wherever this component is mounted (i.e. every page if
  // QuickSearchBox is in nav bar). By default, ignores on INPUT, TEXTAREA,
  // SELECT elements, as we don't supply a second argument.
  useHotkeys([
    ['/', openWithHighlight],
    // Modal component has built-in support for esc to close, so no hotkey
    // declaration is needed for that.
  ]);

  // Second useHotkeys for Ctrl + K, which has an explicit list of no ignored
  // tags. This means the hotkey is available globally. This shortcut is for
  // compatibility with users who are more used to Ctrl + K to trigger a palette,
  // and can be turned off via local storage setting if it causes problems with
  // overriding default browser shortcuts.
  useHotkeys([
    // Cmd + K as fallback for users who prefer that -- although only if they
    // haven't turned it off in their local settings.
    ["mod+K", quickSearchCtrlKEnabled ? openWithHighlight : () => void 0 ],
  ], []);

  // Everywhere vs category-local dropdown store
  const combobox = useCombobox();

  return (
    <>
      <Button className={classes.navButton} px="md" onClick={openWithHighlight}>
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
        // Modal contents must be kept mounted, for we need a stable ref to the
        // TextInput in order to select the contents when the modal opens.
        keepMounted
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
            // Set ref to this input so we can select text programatically
            ref={ref}
            placeholder="Search..."
            size="md"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
            onKeyDown={getHotkeyHandler([
              ["ArrowUp", moveUp],
              ["ArrowDown", moveDown],
              ["Enter", confirmSelection],
            ])}
          />
        </Group>
        {searchQuery.length === 0 && (
          <Text c="dimmed" my="xs" ta="center">Start typing to search...</Text>
        )}
        {searchQuery.length > 0 && (
          <Stack my="xs" gap={0}>
            {Object.values(results).every(k => k.length === 0) && (
              <Text c="dimmed" ta="center">No Results :'(</Text>
            )}
            {results.categories.length > 0 && (
              <>
                <Divider variant="dashed" label="Categories" labelPosition="left"/>
                {results.categories.map((category, i) => {
                  const isSelected = currentSelection.type === "categories" && currentSelection.index === i;
                  return (
                    <QuickSearchResult
                      badge="Category"
                      isSelected={isSelected}
                      key={category.slug}
                      link={itemToPath(category)}
                      onClick={close}
                    >
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
                    <QuickSearchResult
                      badge="Exam"
                      isSelected={isSelected}
                      key={exam.filename}
                      link={itemToPath(exam)}
                      onClick={close}
                    >
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
                    <QuickSearchResult
                      badge="Exam Page"
                      isSelected={isSelected}
                      key={`${exam.filename}-page-${exam.pages[0][0]}`}
                      link={itemToPath(exam)}
                      onClick={close}
                    >
                      <Stack gap={0}>
                        <Text>
                          {exam.headline.map((part, i) => (
                            <HighlightedContent content={part} key={i} />
                          ))} - Page {exam.pages[0][0]}
                        </Text>
                        <Text opacity={0.7}>
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
                    <QuickSearchResult
                      badge="Answer"
                      isSelected={isSelected}
                      key={answer.long_id}
                      link={itemToPath(answer)}
                      onClick={close}
                    >
                      <Stack gap={0}>
                        <Text>
                          {answer.author_displayname} on {answer.exam_displayname} - {answer.category_displayname}
                        </Text>
                        <Text opacity={0.7}>
                          <MarkdownText
                            value={answer.text}
                            regex={new RegExp(`${answer.highlighted_words.map(escapeRegExp).join("|")}`)}
                          />
                        </Text>
                      </Stack>
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
                    <QuickSearchResult
                      badge="Comment"
                      isSelected={isSelected}
                      key={comment.long_id}
                      link={itemToPath(comment)}
                      onClick={close}
                    >
                      <Stack gap={0}>
                        <Text>
                          {comment.author_displayname} on {comment.exam_displayname} - {comment.category_displayname}
                        </Text>
                        <Text opacity={0.7}>
                          <MarkdownText
                            value={comment.text}
                            regex={new RegExp(`${comment.highlighted_words.map(escapeRegExp).join("|")}`)}
                          />
                        </Text>
                      </Stack>
                    </QuickSearchResult>
                  )
                })}
              </>
            )}
            <Divider variant="dashed" label="More" labelPosition="left" />
            <QuickSearchResult
              isSelected={currentSelection.type === "more"}
              link={itemToPath(results.more[0])}
              onClick={close}
            >
              <Text>
                Show all results...
              </Text>
            </QuickSearchResult>
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
