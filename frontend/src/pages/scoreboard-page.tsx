import React, { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Anchor,
  Center,
  Container,
  Group,
  MantineColorsTuple,
  Table,
  Text,
  Title,
  UnstyledButton,
  rem,
  useComputedColorScheme,
  useMantineTheme,
} from "@mantine/core";
import { IconArrowsUpDown, IconChevronDown } from "@tabler/icons-react";
import { useLocalStorageState, useRequest } from "ahooks";
import type { EChartsOption } from "echarts";
import { LineChart } from "echarts/charts";
import {
  DataZoomComponent,
  GridComponent,
  TitleComponent,
  TooltipComponent,
} from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import EChartsCore, { EChartsReactRef } from "react-echarts-library/core";
import { Link } from "react-router-dom";

import { fetchGet } from "../api/fetch-utils";
import LoadingOverlay from "../components/loading-overlay";
import useTitle from "../hooks/useTitle";
import { Stats, UserInfo } from "../interfaces";
import classes from "./scoreboard.module.css";

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  DataZoomComponent,
  CanvasRenderer,
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

const statOptions = (
  xData: string[],
  yData: Record<string, number[]>,
  colors: MantineColorsTuple,
) => {
  return {
    backgroundColor: "transparent",
    grid: {
      top: "0%",
      left: "0%",
      right: "0%",
      containLabel: true,
    },
    dataZoom: [
      {
        // Show last 6 months by default
        startValue: xData.length - 183,
        endValue: xData.length - 1,
        dataBackground: {
          lineStyle: {
            color: colors[3],
          },
          areaStyle: {
            color: colors[2],
          },
        },
      },
    ],
    xAxis: {
      type: "category" as const,
      data: xData,
      boundaryGap: false,
    },
    yAxis: {
      type: "value" as const,
    },
    tooltip: {
      transitionDuration: 0,
      trigger: "axis" as const,
    },
    series: Object.keys(yData).map(name => ({
      name,
      emphasis: {
        lineStyle: {
          width: 5,
          color: colors[6],
        },
      },
      data: yData[name],
      type: "line" as const,
      lineStyle: {
        color: colors[6],
      },
      itemStyle: {
        color: colors[6],
      },
      symbol: "none",
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          {
            offset: 0,
            color: colors[3],
          },
          {
            offset: 1,
            color: colors[6],
          },
        ]),
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

  const {
    data: stats,
    error: statsError,
    loading: statsLoading,
  } = useRequest(loadStats);

  const theme = useMantineTheme();

  const [userStatRef, setUserStatRef] = useState<EChartsReactRef | null>(null);
  const userStatsOptions: EChartsOption = useMemo(
    () =>
      statOptions(
        stats?.user_stats.map(s => s.date) ?? [],
        {
          "User Count": stats?.user_stats.map(s => s.count) ?? [],
        },
        theme.colors[theme.primaryColor],
      ),
    [stats, theme],
  );

  const [examStatRef, setExamStatRef] = useState<EChartsReactRef | null>(null);
  const examStatsOptions: EChartsOption = useMemo(
    () =>
      statOptions(
        stats?.exam_stats.map(s => s.date) ?? [],
        {
          "Total Answer Count":
            stats?.exam_stats.map(s => s.answers_count) ?? [],
          "Unique Questions Answered":
            stats?.exam_stats.map(s => s.answered_count) ?? [],
        },
        theme.colors[theme.primaryColor],
      ),
    [stats, theme],
  );

  const [documentStatRef, setDocumentStatRef] =
    useState<EChartsReactRef | null>(null);
  const documentStatsOptions: EChartsOption = useMemo(
    () =>
      statOptions(
        stats?.document_stats.map(s => s.date) ?? [],
        {
          "Document Count": stats?.document_stats.map(s => s.count) ?? [],
        },
        theme.colors[theme.primaryColor],
      ),
    [stats, theme],
  );

  // When switching light/dark, toggle the same in the chart
  const scheme = useComputedColorScheme();
  useEffect(() => {
    const charts = [
      userStatRef?.getEchartsInstance(),
      examStatRef?.getEchartsInstance(),
      documentStatRef?.getEchartsInstance(),
    ];
    charts.forEach(chart => {
      if (!chart) return;

      if (scheme === "dark") {
        chart.setTheme("dark");
      } else {
        chart.setTheme("default");
      }
    });
  }, [scheme, userStatRef, examStatRef, documentStatRef]);

  return (
    <Container size="xl">
      <Title order={1} my="lg">
        Stats
      </Title>
      {statsError && <Alert color="red">{String(statsError)}</Alert>}

      <Title order={2} my="lg">
        User Stats
      </Title>
      <Container size="md">
        <EChartsCore
          echarts={echarts}
          option={userStatsOptions}
          style={{ height: 300 }}
          ref={setUserStatRef}
          // notMerge is required for dynamic setTheme calls
          notMerge={true}
        />
      </Container>
      <Title order={2} my="lg">
        Exam Stats
      </Title>
      <Container size="md">
        <EChartsCore
          echarts={echarts}
          option={examStatsOptions}
          style={{ height: 300 }}
          ref={setExamStatRef}
          // notMerge is required for dynamic setTheme calls
          notMerge={true}
        />
      </Container>
      <Title order={2} my="lg">
        Document Stats
      </Title>
      <Container size="md">
        <EChartsCore
          echarts={echarts}
          option={documentStatsOptions}
          style={{ height: 300 }}
          ref={setDocumentStatRef}
          // notMerge is required for dynamic setTheme calls
          notMerge={true}
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
