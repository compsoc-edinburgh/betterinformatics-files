import { useRequest } from "ahooks";
import { Container, TextInput } from "@mantine/core";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
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

const SearchPage: React.FC = () => {
  useTitle("Search");

  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";

  const [term, setTerm] = useState(query);

  // If this and url disagree, url has changed (e.g. navigating back)
  // Without this, we cannot differentiate between the user typing and navigation
  const [prevQuery, setPrevQuery] = useState(query);
  if (query !== prevQuery) {
    setPrevQuery(query);
    setTerm(query);
  }

  useEffect(() => {
    if (term === query) return;

    const timeout = setTimeout(() => {
      setSearchParams(prev => {
        const result = new URLSearchParams(prev);

        if (term) result.set("q", term);
        else result.delete("q");

        return result;
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [term, query, setSearchParams]);

  const { data, error, loading } = useRequest(
    () => (query ? loadSearch(query) : Promise.resolve([])),
    {
      refreshDeps: [query],
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
            {data?.length === 0 && query !== "" && (
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
