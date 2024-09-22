import { useLocalStorageState, useRequest } from "@umijs/hooks";
import {
  Anchor,
  Alert,
  Center,
  Container,
  Group,
  Table,
  UnstyledButton,
  SegmentedControl,
  Text,
  Title,
  rem,
} from "@mantine/core";
import { LineChart } from "@mantine/charts";
import React from "react";
import { Link } from "react-router-dom";
import LoadingOverlay from "../components/loading-overlay";
import { fetchGet } from "../api/fetch-utils";
import { UserInfo, Stats } from "../interfaces";
import useTitle from "../hooks/useTitle";
import { IconArrowsUpDown, IconChevronDown } from "@tabler/icons-react";
import classes from "./scoreboard.module.css";

const modes = [
  "score",
  "score_answers",
  "score_comments",
  "score_cuts",
  "score_documents",
] as const;
type Mode = (typeof modes)[number];
const loadScoreboard = async (scoretype: Mode) => {
  return (await fetchGet(`/api/scoreboard/top/${scoretype}/`))
    .value as UserInfo[];
};

const loadStats = async () => {
  return (await fetchGet("/api/stats/")).value as Stats;
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
  useTitle("Stats and Scores");
  const [mode, setMode] = useLocalStorageState<Mode>(
    "scoreboard-mode",
    "score",
  );
  const { error, loading, data } = useRequest(() => loadScoreboard(mode), {
    refreshDeps: [mode],
    cacheKey: `scoreboard-${mode}`,
  });

  const [statsGranularity, setStatsGranularity] = useLocalStorageState<string>(
    "stats-granularity",
    "Weekly",
  );

  const {
    data: stats,
    error: statsError,
    loading: statsLoading,
  } = useRequest(loadStats);
  return (
    <Container size="xl">
      <Title order={1} my="lg">
        Stats
      </Title>
      <SegmentedControl
        value={statsGranularity}
        onChange={setStatsGranularity}
        data={[
          { label: "Weekly", value: "Weekly" },
          { label: "Monthly", value: "Monthly" },
          { label: "Semesterly", value: "Semesterly" },
        ]}
      />
      {statsError && <Alert color="red">{String(statsError)}</Alert>}

      <Title order={2} my="lg">
        {statsGranularity} User Stats
      </Title>
      <Container size="md">
        <LineChart
          h={300}
          data={
            (statsGranularity === "Weekly"
              ? stats?.weekly_user_stats
              : statsGranularity === "Monthly"
              ? stats?.monthly_user_stats
              : statsGranularity === "Semesterly"
              ? stats?.semesterly_user_stats
              : []) || []
          }
          dataKey="date"
          series={[{ name: "count", label: "User Count", color: "indigo.6" }]}
          curveType="monotone"
        />
      </Container>
      <Title order={2} my="lg">
        {statsGranularity} Answered Questions Stats
      </Title>
      <Container size="md">
        <LineChart
          h={300}
          data={
            (statsGranularity === "Weekly"
              ? stats?.weekly_exam_stats
              : statsGranularity === "Monthly"
              ? stats?.monthly_exam_stats
              : statsGranularity === "Semesterly"
              ? stats?.semesterly_exam_stats
              : []) || []
          }
          dataKey="date"
          series={[
            {
              name: "answers_count",
              label: "Total Answer Count",
              color: "cyan.6",
            },
            {
              name: "answered_count",
              label: "Unique Questions Answered",
              color: "blue.6",
            },
          ]}
          curveType="monotone"
        />
      </Container>
      <Title order={2} my="lg">
        {statsGranularity} Document Stats
      </Title>
      <Container size="md">
        <LineChart
          h={300}
          data={
            (statsGranularity === "Weekly"
              ? stats?.weekly_document_stats
              : statsGranularity === "Monthly"
              ? stats?.monthly_document_stats
              : statsGranularity === "Semesterly"
              ? stats?.semesterly_document_stats
              : []) || []
          }
          dataKey="date"
          series={[
            { name: "count", label: "Document Count", color: "green.6" },
          ]}
          tickLine="x"
          curveType="monotone"
        />
      </Container>

      <h1>Scoreboard</h1>
      {error && <Alert color="red">{error.message}</Alert>}
      <LoadingOverlay visible={loading || statsLoading} />
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
                Sections Cut
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
                      {board.username}
                    </Anchor>
                  </Table.Td>
                  <Table.Td>{board.score}</Table.Td>
                  <Table.Td>{board.score_answers}</Table.Td>
                  <Table.Td>{board.score_comments}</Table.Td>
                  <Table.Td>{board.score_documents}</Table.Td>
                  <Table.Td>{board.score_cuts}</Table.Td>
                </Table.Tr>
              ))}
          </Table.Tbody>
        </Table>
      </div>
    </Container>
  );
};
export default Scoreboard;
