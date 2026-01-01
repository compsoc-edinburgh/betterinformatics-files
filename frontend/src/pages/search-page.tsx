import { useDebounce, useRequest } from "@umijs/hooks";
import { Container, TextInput } from "@mantine/core";
import React, { useEffect, useState } from "react";
import { StringParam, useQueryParam } from "use-query-params";
import { fetchPost } from "../api/fetch-utils";
import LoadingOverlay from "../components/loading-overlay";
import SearchResults from "../components/search-results";
import useTitle from "../hooks/useTitle";
import { SearchResponse } from "../interfaces";
import { IconSearch } from "@tabler/icons-react";

const loadSearch = async (term: string) => {
  return (await fetchPost("/api/exam/search/", { term }))
    .value as SearchResponse;
};

const SearchPage: React.FC<{}> = () => {
  useTitle("Search");
  const [query, setQuery] = useQueryParam("q", StringParam);
  const [optionalTerm, setTerm] = useState(query);
  const term = optionalTerm || "";
  const debouncedTerm = useDebounce(term, 300);

  // Store previous query param so we can use it to check if params changed.
  // If params did change, our useEffect will create one extra re-render to
  // update the text input field retroactively if it isn't already matching.
  const [prevQuery, setPrevQuery] = useState(query);
  useEffect(() => {
    if (query === prevQuery) return; // Make sure we don't enter infinite loop
    setPrevQuery(query);

    // We have a new query param that's different from last render. If this is
    // caused by something other than our user changing the term (for example,
    // by quick search bar navigation), then update the input box.
    if (query === term) return;
    setTerm(query);
  }, [query, prevQuery, term]);

  useEffect(() => {
    // Update the query param on user input change
    setQuery(debouncedTerm);
  }, [setQuery, debouncedTerm]);
  const { data, error, loading } = useRequest(
    () => (debouncedTerm ? loadSearch(debouncedTerm) : Promise.resolve([])),
    {
      refreshDeps: [debouncedTerm],
    },
  );
  return (
    <>
      <Container size="md" my="xs">
        <TextInput
          placeholder="Search"
          type="text"
          leftSection={<IconSearch />}
          value={term}
          onChange={e => setTerm(e.currentTarget.value)}
          autoFocus
        />
      </Container>
      <div>
        <LoadingOverlay visible={loading} />
        <Container size="xl">
          <div>
            {data && data.length === 0 && debouncedTerm !== "" && (
              <div>
                <h4>No Result</h4>
                <p>We couldn't find anything matching your search term.</p>
              </div>
            )}
            {data && <SearchResults data={data} />}
            {error && (
              <div>
                An error occurred:{" "}
                <div>
                  <pre>{JSON.stringify(error, null, 3)}</pre>
                </div>
              </div>
            )}
          </div>
        </Container>
      </div>
    </>
  );
};
export default SearchPage;
