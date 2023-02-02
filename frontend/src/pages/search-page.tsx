import { useDebounce, useRequest } from "@umijs/hooks";
import { Container, TextInput } from "@mantine/core";
import React, { useEffect, useState } from "react";
import { StringParam, useQueryParam } from "use-query-params";
import { fetchPost } from "../api/fetch-utils";
import LoadingOverlay from "../components/loading-overlay";
import SearchResults from "../components/search-results";
import useTitle from "../hooks/useTitle";
import { SearchResponse } from "../interfaces";
import { Icon, ICONS } from "vseth-canine-ui";

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
  useEffect(() => {
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
      <Container size="md" className="my-1">
        <TextInput
          placeholder="Search"
          type="text"
          icon={<Icon icon={ICONS.SEARCH} />}
          value={term}
          onChange={e => setTerm(e.currentTarget.value)}
        />
      </Container>
      <div className="position-relative">
        <LoadingOverlay loading={loading} />
        <Container>
          <div>
            {data && data.length === 0 && debouncedTerm !== "" && (
              <div className="text-center p-4">
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
