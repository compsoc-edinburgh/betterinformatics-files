import useTitle from "../hooks/useTitle";
import { useState } from "react";
import { useRequest } from "@umijs/hooks";
import { fetchPost } from "../api/fetch-utils";
import { Container, FormGroup } from "@vseth/components";
import React from "react";

const loadSearch = async (term: string) => {
  return (await fetchPost("/api/exam/search/", { term })).value as any[];
};
const SearchPage: React.FC<{}> = () => {
  useTitle("VIS Community Solutions");
  const [term, setTerm] = useState("");
  const { data, error, loading } = useRequest(
    () => (term ? loadSearch(term) : Promise.resolve([])),
    {
      refreshDeps: [term],
    },
  );
  return (
    <Container>
      <FormGroup className="m-1">
        <div className="search m-0">
          <input
            type="text"
            className="search-input"
            placeholder="Filter..."
            value={term}
            onChange={e => setTerm(e.currentTarget.value)}
            autoFocus
          />
          <div className="search-icon-wrapper">
            <div className="search-icon" />
          </div>
        </div>
      </FormGroup>
      {data && (
        <div>
          Data{" "}
          <pre style={{ whiteSpace: "break-spaces" }}>
            {JSON.stringify(data, null, 3)}
          </pre>
        </div>
      )}
      {error && (
        <div>
          Error <pre>{JSON.stringify(error, null, 3)}</pre>
        </div>
      )}
      {loading && (
        <div>
          Loading <pre>{JSON.stringify(loading)}</pre>
        </div>
      )}
    </Container>
  );
};
export default SearchPage;
