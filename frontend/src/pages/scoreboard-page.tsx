import { useLocalStorageState, useRequest } from "@umijs/hooks";
import {
  Anchor,
  Alert,
  Center,
  Container,
  Group,
  Table,
  UnstyledButton,
  Text,
  rem,
} from "@mantine/core";
import React from "react";
import { Link } from "react-router-dom";
import LoadingOverlay from "../components/loading-overlay";
import { fetchGet } from "../api/fetch-utils";
import { UserInfo } from "../interfaces";
import useTitle from "../hooks/useTitle";
import { IconArrowsUpDown, IconChevronDown } from "@tabler/icons-react";
import classes from "./scoreboard.module.css";

const modes = [
  "score",
  "score_answers",
  "score_comments",
  "score_cuts",
  "score_legacy",
  "score_documents",
] as const;
type Mode = (typeof modes)[number];
const loadScoreboard = async (scoretype: Mode) => {
  return (await fetchGet(`/api/scoreboard/top/${scoretype}/`))
    .value as UserInfo[];
};

interface ThProps {
  children: React.ReactNode;
  sorted: boolean;
  onSort(): void;
}

function Th({ children, sorted, onSort }: ThProps) {
  const Icon = sorted ? IconChevronDown : IconArrowsUpDown;
  return (
    <Table.Th className={classes.th}>
      <UnstyledButton onClick={onSort} className={classes.control}>
        <Group justify="space-between">
          <Text fw={600}>{children}</Text>
          <Center className={classes.icon}>
            <Icon
              style={{
                width: rem(16),
                height: rem(16),
                color: "var(--mantine-color-dimmed)",
              }}
            />
          </Center>
        </Group>
      </UnstyledButton>
    </Table.Th>
  );
}

const Scoreboard: React.FC<{}> = () => {
  useTitle("Scoreboard");
  const [mode, setMode] = useLocalStorageState<Mode>(
    "scoreboard-mode",
    "score",
  );
  const { error, loading, data } = useRequest(() => loadScoreboard(mode), {
    refreshDeps: [mode],
    cacheKey: `scoreboard-${mode}`,
  });
  return (
    <Container size="xl">
      <h1>Scoreboard</h1>
      {error && <Alert color="red">{error.message}</Alert>}
      <LoadingOverlay visible={loading} />
      <div className={classes.overflowScroll}>
        <Table highlightOnHover verticalSpacing="md" fz="md">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>
                <Text fw={600} size="md">
                  Rank
                </Text>
              </Table.Th>
              <Table.Th>
                <Text fw={600} size="md">
                  User
                </Text>
              </Table.Th>
              <Th onSort={() => setMode("score")} sorted={mode === "score"}>
                Score
              </Th>
              <Th
                onSort={() => setMode("score_answers")}
                sorted={mode === "score_answers"}
              >
                Answers
              </Th>
              <Th
                onSort={() => setMode("score_comments")}
                sorted={mode === "score_comments"}
              >
                Comments
              </Th>
              <Th
                onSort={() => setMode("score_documents")}
                sorted={mode === "score_documents"}
              >
                Documents
              </Th>
              <Th
                onSort={() => setMode("score_cuts")}
                sorted={mode === "score_cuts"}
              >
                Import Exams
              </Th>
              <Th
                onSort={() => setMode("score_legacy")}
                sorted={mode === "score_legacy"}
              >
                Legacy Answers
              </Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data &&
              data.map((board, idx) => (
                <Table.Tr key={board.username}>
                  <Table.Td>{idx + 1}</Table.Td>
                  <Table.Td>
                    <Anchor component={Link} to={`/user/${board.username}`}>
                      {board.displayName}
                    </Anchor>
                  </Table.Td>
                  <Table.Td>{board.score}</Table.Td>
                  <Table.Td>{board.score_answers}</Table.Td>
                  <Table.Td>{board.score_comments}</Table.Td>
                  <Table.Td>{board.score_documents}</Table.Td>
                  <Table.Td>{board.score_cuts}</Table.Td>
                  <Table.Td>{board.score_legacy}</Table.Td>
                </Table.Tr>
              ))}
          </Table.Tbody>
        </Table>
      </div>
    </Container>
  );
};
export default Scoreboard;
