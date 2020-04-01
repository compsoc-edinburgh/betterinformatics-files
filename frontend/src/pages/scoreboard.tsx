import { useLocalStorageState, useRequest } from "@umijs/hooks";
import { Alert, Button, Container, Table } from "@vseth/components";
import React from "react";
import { Link } from "react-router-dom";
import LoadingOverlay from "../components/loading-overlay";
import { fetchapi } from "../api/fetch-utils";
import { UserInfo } from "../interfaces";

const modes = [
  "score",
  "score_answers",
  "score_comments",
  "score_cuts",
  "score_legacy",
] as const;
type Mode = typeof modes[number];
const loadScoreboard = async (scoretype: Mode) => {
  return (await fetchapi(`/api/scoreboard/top/${scoretype}/`))
    .value as UserInfo[];
};
const Scoreboard: React.FC<{}> = () => {
  const [mode, setMode] = useLocalStorageState<Mode>(
    "scoreboard-mode",
    "score",
  );
  const { error, loading, data } = useRequest(() => loadScoreboard(mode), {
    refreshDeps: [mode],
    cacheKey: `scoreboard-${mode}`,
  });
  return (
    <Container>
      <h1>Scoreboard</h1>
      {error && <Alert color="danger">{error.message}</Alert>}
      <LoadingOverlay loading={loading} />
      <div style={{ overflow: "scroll" }}>
        <Table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>User</th>
              <th>
                <Button
                  color="white"
                  onClick={() => setMode("score")}
                  active={mode === "score"}
                >
                  Score
                </Button>
              </th>
              <th>
                <Button
                  color="white"
                  onClick={() => setMode("score_answers")}
                  active={mode === "score_answers"}
                >
                  Answers
                </Button>
              </th>
              <th>
                <Button
                  color="white"
                  onClick={() => setMode("score_comments")}
                  active={mode === "score_comments"}
                >
                  Comments
                </Button>
              </th>
              <th>
                <Button
                  color="white"
                  onClick={() => setMode("score_cuts")}
                  active={mode === "score_cuts"}
                >
                  Import Exams
                </Button>
              </th>
              <th>
                <Button
                  color="white"
                  onClick={() => setMode("score_legacy")}
                  active={mode === "score_legacy"}
                >
                  Import Wiki
                </Button>
              </th>
            </tr>
          </thead>
          <tbody>
            {data &&
              data.map((board, idx) => (
                <tr key={board.username}>
                  <td>{idx + 1}</td>
                  <td>
                    <Link to={"/user/" + board.username}>
                      {board.displayName}
                    </Link>
                  </td>
                  <td>{board.score}</td>
                  <td>{board.score_answers}</td>
                  <td>{board.score_comments}</td>
                  <td>{board.score_cuts}</td>
                  <td>{board.score_legacy}</td>
                </tr>
              ))}
          </tbody>
        </Table>
      </div>
    </Container>
  );
};
export default Scoreboard;
