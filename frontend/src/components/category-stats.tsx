import React, { useMemo, useRef } from "react";
import {
  Alert,
  Box,
  Group,
  Paper,
  Skeleton,
  Stack,
  Text,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { useCourseStats } from "../api/hooks";
import EChartsCore, { EChartsReactRef } from "react-echarts-library/core";
import * as echarts from "echarts/core";
import type {
  EChartsOption,
  TooltipComponentPositionCallbackParams,
} from "echarts";
import { LineChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
} from "echarts/components";
import { LabelLayout } from "echarts/features";
import { CanvasRenderer } from "echarts/renderers";
import { CourseStats } from "../interfaces";

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  CanvasRenderer,
  LabelLayout,
]);

interface CategoryStatsProps {
  slug: string;
}

const CategoryStatsComponent: React.FC<CategoryStatsProps> = ({ slug }) => {
  const [error, loading, stats] = useCourseStats(slug);

  // Colors for different course codes
  const theme = useMantineTheme();
  const colors = useMemo(
    () => [
      theme.colors[theme.primaryColor][6],
      theme.colors.blue[6],
      theme.colors.green[6],
      theme.colors.yellow[6],
      theme.colors.red[6],
      theme.colors.violet[6],
      theme.colors.orange[6],
      theme.colors.teal[6],
    ],
    [theme],
  );
  const chartRef = useRef<EChartsReactRef>(null);

  const { sortedYears, codes, combinedData } = useMemo(() => {
    if (!stats || stats.length === 0) {
      return { sortedYears: [], codes: [], combinedData: [] };
    }

    // Group stats by year and course code
    const yearGroups: { [year: string]: { [code: string]: CourseStats } } = {};
    const allCourseCodes = new Set<string>();

    stats.forEach(stat => {
      if (!yearGroups[stat.academic_year]) {
        yearGroups[stat.academic_year] = {};
      }
      yearGroups[stat.academic_year][stat.course_code] = stat;
      allCourseCodes.add(stat.course_code);
    });

    const sortedYears = Object.keys(yearGroups).sort();
    const codes = Array.from(allCourseCodes).sort();

    // Prepare data for chart
    const combinedData: any[] = sortedYears.map(year => {
      const yearData: any = { year };
      codes.forEach(code => {
        const stat = yearGroups[year][code];
        if (stat?.mean_mark !== null && stat?.mean_mark !== undefined) {
          yearData[code] = Number(stat.mean_mark.toFixed(1));
          // Store standard deviation for tooltip
          yearData[`${code}_std`] = stat?.std_deviation
            ? Number(stat.std_deviation.toFixed(1))
            : null;
          // Store organiser for tooltip
          yearData[`${code}_organiser`] = stat.course_organiser;
          yearData[`${code}_organiser_changed`] =
            yearGroups[sortedYears[sortedYears.indexOf(year) - 1]]?.[code]
              ?.course_organiser !== stat.course_organiser ||
            yearGroups[sortedYears[sortedYears.indexOf(year) - 1]]?.[code]
              ?.mean_mark === null;
        }
      });
      return yearData;
    });

    return {
      sortedYears,
      codes,
      combinedData,
    };
  }, [stats]);

  const chartOption = useMemo(() => {
    return {
      xAxis: {
        type: "category",
        data: sortedYears,
        boundaryGap: false,
        axisLabel: {
          alignMinLabel: "left",
          alignMaxLabel: "right",
          align: "center", // All other labels remain centered
        },
        axisPointer: {
          type: "line",
          snap: true,
          triggerEmphasis: false,
        },
      },
      grid: {
        top: "0%",
        left: "0%",
        right: "0%",
        bottom: "0%",
        outerBoundsContain: "axisLabel",
      },
      yAxis: {
        type: "value",
        max: 100,
        axisLabel: {
          formatter: "{value} %",
        },
      },
      tooltip: {
        transitionDuration: 0,
        trigger: "axis",
        position: (
          point,
          params: TooltipComponentPositionCallbackParams,
          dom,
          rect,
          size,
        ) => {
          if (!Array.isArray(params)) params = [params];
          // Position at nearest x-axis item
          const xIndex = params[0].dataIndex;

          const gridX = chartRef.current
            ?.getEchartsInstance()
            ?.convertToPixel({ xAxisIndex: 0 }, 0);
          if (gridX === undefined) {
            return { left: point[0], bottom: 30 }; // Fallback to cursor position
          }

          const gridXEnd = chartRef.current
            ?.getEchartsInstance()
            ?.convertToPixel({ xAxisIndex: 0 }, sortedYears.length - 1);
          if (gridXEnd === undefined) {
            return { left: point[0], bottom: 30 }; // Fallback to cursor position
          }
          const gridW = gridXEnd - gridX;

          const xPos =
            gridX +
            (xIndex / (sortedYears.length - 1)) * gridW -
            size.contentSize[0] / 2;

          return { left: xPos, bottom: 30 };
        },
        formatter: (params: any) => {
          if (!Array.isArray(params)) params = [params];
          if (params.length === 0 || !params[0].value) {
            return ""; // No tooltip if no data
          }

          const year = params[0].value[0];
          let tooltip = `<div style="font-size: var(--mantine-font-size-xs); display: flex; flex-direction: column; gap: 0; line-height: var(--mantine-line-height)"><strong>${year}</strong>`;

          params.forEach((param: any) => {
            if (param.value[1] === null || param.value[1] === undefined) {
              return; // Skip if mean mark is not available
            }
            const code = param.seriesName;
            const meanMark = param.value[1];
            const stdDev = param.value[2];
            const organiser = param.value[3];
            tooltip += `<span><span style="color:${param.color}">\u25CF</span> <strong>${code}</strong>: ${meanMark}%</span>`;
            if (organiser) {
              tooltip += `<span style="color:var(--mantine-color-dimmed)">CO: ${organiser}</span>`;
            }
            if (stdDev) {
              tooltip += `<span style="color:var(--mantine-color-dimmed)">Standard Deviation: ±${stdDev}%</span>`;
            }
          });
          tooltip += "</div>";
          return tooltip;
        },
      },
      series: codes.map(code => ({
        name: code,
        type: "line",
        data: combinedData.map(d => [
          d["year"],
          d[code],
          d[`${code}_std`],
          d[`${code}_organiser`],
          d[`${code}_organiser_changed`],
        ]),
        lineStyle: {
          color: colors[codes.indexOf(code) % colors.length].replace(
            "0.3",
            "0.8",
          ),
        },
        itemStyle: {
          color: colors[codes.indexOf(code) % colors.length].replace(
            "0.3",
            "0.8",
          ),
        },
        emphasis: {
          lineStyle: {
            width: 9,
            color: colors[codes.indexOf(code) % colors.length].replace(
              "0.3",
              "1.0",
            ),
          },
        },
        label: {
          show: true,
          formatter: (params: any) => {
            // Show only if course organizer changed
            const organiser = params.value[3];
            const organiserChanged = params.value[4];
            if (organiser && organiserChanged) {
              return `CO: ${organiser}`;
            }
            return "";
          },
          position: "bottom",
          align: "left",
          color: colors[codes.indexOf(code) % colors.length].replace(
            "0.3",
            "0.8",
          ),
        },
        labelLine: {
          show: true,
          length2: 5,
          lineStyle: {
            color: "#bbb",
          },
        },
        labelLayout: (params: any) => {
          const gridXEnd = chartRef.current
            ?.getEchartsInstance()
            ?.convertToPixel({ xAxisIndex: 0 }, sortedYears.length - 1);
          if (gridXEnd === undefined) {
            return { x: params.labelRect.x, y: params.labelRect.y }; // Fallback to default position
          }

          return {
            moveOverlap: true,
            x:
              params.labelRect.x + params.labelRect.width > gridXEnd - 50
                ? params.labelRect.x - params.labelRect.width - 5
                : params.labelRect.x,
            y: params.labelRect.y,
          };
        },
      })),
    } as EChartsOption;
  }, [sortedYears, codes, combinedData, colors]);

  if (loading && !stats) {
    return (
      <Stack gap="md">
        <Skeleton height={300} />
        <Skeleton height={300} />
      </Stack>
    );
  }

  if (error) {
    return (
      <Alert color="red" title="Error">
        Failed to load course statistics: {error.message}
      </Alert>
    );
  }

  if (!stats || stats.length === 0) {
    return (
      <Alert color="blue" title="No Data Available">
        No grade statistics are available for this category. This may be
        because:
        <ul>
          <li>The category doesn't have any associated Euclid codes</li>
          <li>Course data hasn't been loaded for the associated courses</li>
          <li>Statistics are not available for the courses in this category</li>
        </ul>
      </Alert>
    );
  }

  return (
    <Stack gap="lg">
      <Box>
        <Title order={3} mb="md">
          Course Grades Over Time
        </Title>
        <Text size="sm" c="dimmed" mb="md">
          Hover over data points to see mean marks, standard deviation, and
          course organiser information. Labels are added where course organisers
          have changed.
        </Text>
        <Paper withBorder p="md">
          <EChartsCore
            echarts={echarts}
            option={chartOption}
            style={{ height: 400 }}
            ref={chartRef}
            replaceMerge="series"
          />
        </Paper>
      </Box>

      {stats.length > 0 && (
        <Box>
          <Title order={3} mb="md">
            Data Overview
          </Title>
          <Group gap="md">
            {codes.map(code => {
              const courseStats = stats.filter(s => s.course_code === code);
              const latestStat = courseStats
                .sort((a, b) => a.academic_year.localeCompare(b.academic_year))
                .pop();

              return (
                <Paper key={code} withBorder p="md" style={{ minWidth: 200 }}>
                  <Stack gap={0}>
                    <Text fw={600} size="lg">
                      {code}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {latestStat?.course_name}
                    </Text>
                    {latestStat?.course_organiser && (
                      <Text size="sm" c="dimmed" mt="xs">
                        CO: {latestStat.course_organiser}
                      </Text>
                    )}
                    {latestStat?.mean_mark && (
                      <Text size="md" mt="xs">
                        Latest Mean:{" "}
                        <Text span fw={500}>
                          {latestStat.mean_mark.toFixed(1)}%
                        </Text>
                      </Text>
                    )}
                    {latestStat?.std_deviation && (
                      <Text size="sm" c="dimmed">
                        Std Dev: ±{latestStat.std_deviation.toFixed(1)}%
                      </Text>
                    )}
                    <Text size="xs" c="dimmed" mt="xs">
                      {courseStats.length} year
                      {courseStats.length !== 1 ? "s" : ""} of data
                    </Text>
                  </Stack>
                </Paper>
              );
            })}
          </Group>
        </Box>
      )}
    </Stack>
  );
};

export default CategoryStatsComponent;
