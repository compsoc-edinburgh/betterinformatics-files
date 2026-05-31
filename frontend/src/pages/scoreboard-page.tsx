import { useLocalStorageState, useRequest } from "ahooks";
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
import React from "react";
import EChartsCore from "react-echarts-library/core";
import * as echarts from "echarts/core";
import type { EChartsOption } from "echarts";
import { LineChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
} from "echarts/components";
import { SVGRenderer } from "echarts/renderers";
import { Link } from "react-router-dom";
import LoadingOverlay from "../components/loading-overlay";
import { fetchGet } from "../api/fetch-utils";
import { UserInfo, Stats } from "../interfaces";
import useTitle from "../hooks/useTitle";
import { IconArrowsUpDown, IconChevronDown } from "@tabler/icons-react";
import classes from "./scoreboard.module.css";

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  SVGRenderer,
]);

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

const statOptions = (xData: string[], yData: Record<string, number[]>) => {
  return {
    xAxis: {
      type: "category" as const,
      data: xData,
      boundaryGap: false,
    },
    yAxis: {
      type: "value" as const,
    },
    tooltip: {
      trigger: "axis" as const,
    },
    series: Object.keys(yData).map(name => ({
      name,
      emphasis: {
        lineStyle: {
          width: 5,
          color: "var(--mantine-color-indigo-6)",
        },
      },
      data: yData[name],
      type: "line" as const,
      lineStyle: {
        color: "var(--mantine-color-indigo-6)",
      },
      itemStyle: {
        color: "var(--mantine-color-indigo-6)",
      },
    })),
  } as EChartsOption;
};

const Scoreboard: React.FC = () => {
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
    "weekly",
  );

  const {
    data: stats,
    error: statsError,
    loading: statsLoading,
  } = useRequest(loadStats);

  const userStatsOptions: EChartsOption = statOptions(
    stats?.user_stats[statsGranularity].map(s => s.date) ?? [],
    {
      "User Count": stats?.user_stats[statsGranularity].map(s => s.count) || [],
    },
  );

  const examStatsOptions: EChartsOption = statOptions(
    stats?.exam_stats[statsGranularity].map(s => s.date) ?? [],
    {
      "Total Answer Count":
        stats?.exam_stats[statsGranularity].map(s => s.answers_count) || [],
      "Unique Questions Answered":
        stats?.exam_stats[statsGranularity].map(s => s.answered_count) || [],
    },
  );

  const documentStatsOptions: EChartsOption = statOptions(
    stats?.document_stats[statsGranularity].map(s => s.date) ?? [],
    {
      "Document Count":
        stats?.document_stats[statsGranularity].map(s => s.count) || [],
    },
  );

  return (
    <Container size="xl">
      <Title order={1} my="lg">
        Stats
      </Title>
      <SegmentedControl
        value={statsGranularity}
        onChange={setStatsGranularity}
        data={[
          // Should equal the values in the backend as it is used as a key
          { label: "Weekly", value: "weekly" },
          { label: "Monthly", value: "monthly" },
          { label: "Semesterly", value: "semesterly" },
        ]}
      />
      {statsError && <Alert color="red">{String(statsError)}</Alert>}

      <Title order={2} my="lg">
        {statsGranularity.charAt(0).toUpperCase() + statsGranularity.slice(1)}{" "}
        User Stats
      </Title>
      <Container size="md">
        <EChartsCore
          echarts={echarts}
          option={userStatsOptions}
          style={{ height: 300 }}
        />
      </Container>
      <Title order={2} my="lg">
        {statsGranularity.charAt(0).toUpperCase() + statsGranularity.slice(1)}{" "}
        Answered Questions Stats
      </Title>
      <Container size="md">
        <EChartsCore
          echarts={echarts}
          option={examStatsOptions}
          style={{ height: 300 }}
        />
      </Container>
      <Title order={2} my="lg">
        {statsGranularity.charAt(0).toUpperCase() + statsGranularity.slice(1)}{" "}
        Document Stats
      </Title>
      <Container size="md">
        <EChartsCore
          echarts={echarts}
          option={documentStatsOptions}
          style={{ height: 300 }}
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
            {data?.map((board, idx) => (
              <Table.Tr key={board.username}>
                <Table.Td>{idx + 1}</Table.Td>
                <Table.Td>
                  <Anchor component={Link} to={`/user/${board.username}`}>
                    {board.username}{" "}
                    {board.displayName != board.username &&
                      `(${board.displayName})`}
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
