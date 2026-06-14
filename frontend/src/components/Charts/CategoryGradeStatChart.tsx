import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useComputedColorScheme, useMantineTheme } from "@mantine/core";
import type {
  EChartsOption,
  EChartsType,
  LabelFormatterCallback,
  LabelLayoutOptionCallbackParams,
  TooltipComponentOption,
  TooltipComponentPositionCallbackParams,
} from "echarts";
import { LineChart, CustomChart } from "echarts/charts";
import {
  GridComponent,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
} from "echarts/components";
import * as echarts from "echarts/core";
import { LabelLayout } from "echarts/features";
import { CanvasRenderer } from "echarts/renderers";
import EChartsCore, {
  EChartsCoreProps,
  EChartsEventHandler,
  EChartsEventsMap,
  EChartsReactRef,
} from "react-echarts-library/core";

echarts.use([
  LineChart,
  CustomChart,
  GridComponent,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
  LabelLayout,
]);

interface ChartCourseInstanceStats {
  mean_mark: number | null;
  std_deviation: number | null;
  course_organiser: string | null;
  organiser_changed: boolean;
}

export interface ChartCourseStats {
  academic_year: string;
  course_code: Record<string, ChartCourseInstanceStats | undefined>;
}

interface CategoryGradeStatChartProps {
  sortedYears: string[];
  codes: string[];
  combinedData: ChartCourseStats[];
}

export const CategoryGradeStatChart: React.FC<
  CategoryGradeStatChartProps & Omit<EChartsCoreProps, "echarts" | "option">
> = ({ sortedYears, codes, combinedData, ...props }) => {
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

  const [chartRef, setChartRef] = useState<EChartsReactRef | null>(null);

  // When switching light/dark, toggle the same in the chart
  const scheme = useComputedColorScheme();
  useEffect(() => {
    const chart = chartRef?.getEchartsInstance();
    if (!chart) return;

    if (scheme === "dark") {
      chart.setTheme("dark");
    } else {
      chart.setTheme("default");
    }
  }, [scheme, chartRef]);

  const chartOption = useMemo(() => {
    return {
      backgroundColor: "transparent",
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
      legend: {
        right: 0,
        top: 0,
        data: codes,
      },
      grid: {
        top: "10%",
        bottom: "0%",
        left: "0%",
        right: "0%",
        outerBoundsContain: "axisLabel",
      },
      yAxis: {
        type: "value",
        max: 100,
        axisLabel: {
          formatter: "{value} %",
        },
        splitLine: {
          lineStyle: {
            type: "dashed",
          },
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

          const gridX = chartRef
            ?.getEchartsInstance()
            ?.convertToPixel({ xAxisIndex: 0 }, 0);
          if (gridX === undefined) {
            return { left: point[0], bottom: 30 }; // Fallback to cursor position
          }

          const gridXEnd = chartRef
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
        formatter: params => {
          if (!Array.isArray(params)) params = [params];
          if (
            params.length === 0 ||
            !params[0].value ||
            !Array.isArray(params[0].value)
          ) {
            return ""; // No tooltip if no data
          }

          const year = params[0].value[0] as string;
          let tooltip = `<div style="font-size: var(--mantine-font-size-xs); display: flex; flex-direction: column; gap: 0; line-height: var(--mantine-line-height)"><strong>${year}</strong>`;

          params.forEach(param => {
            const value = param.value as (
              | string
              | number
              | boolean
              | null
              | undefined
            )[];
            if (value[1] === null || value[1] === undefined) {
              // Skip if mean mark is not available
              return;
            }
            // Or if name ends with "-stddev" (for custom error bar series)
            if (param.seriesName?.endsWith("-stddev")) {
              return;
            }
            const code = param.seriesName;
            const meanMark = value[1];
            const stdDev = value[2];
            const organiser = value[3];
            const color = param.color as string;
            tooltip += `<span><span style="color: ${color}">\u25CF</span> <strong>${code}</strong>: ${meanMark}%</span>`;
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
      } as TooltipComponentOption,
      series: [
        // Main line series for each course code
        ...codes.map((code, ix) => ({
          name: code,
          type: "line",
          triggerEvent: "line",
          data: combinedData.map(d => {
            const value = [
              d.academic_year,
              d.course_code[code]?.mean_mark,
              d.course_code[code]?.std_deviation,
              d.course_code[code]?.course_organiser,
              d.course_code[code]?.organiser_changed,
            ];
            if (d.course_code[code]?.organiser_changed) {
              return {
                value,
                label: { show: true },
              };
            }
            return value;
          }),
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
            formatter: (params => {
              if (!params.value) return undefined;
              const value = params.value as (
                | string
                | number
                | boolean
                | null
                | undefined
              )[];
              // Show only if course organizer changed
              const organiser = value[3];
              const organiserChanged = value[4];
              if (organiser && organiserChanged) {
                return `CO: ${organiser}`;
              }
              return undefined;
            }) as LabelFormatterCallback,
            position: ix % 2 === 0 ? "top" : "bottom",
            align: "left",
            color: colors[codes.indexOf(code) % colors.length].replace(
              "0.3",
              "0.8",
            ),
          },
          labelLine: {
            show: true,
            length2: 5,
            smooth: true,
            lineStyle: {
              color: "#bbb",
            },
          },
          labelLayout: (params: LabelLayoutOptionCallbackParams) => {
            const gridXEnd = chartRef
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
              y: params.labelRect.y + (ix % 2 === 0 ? -30 : 30),
            };
          },
        })),
        // Standard deviation series as custom error bars
        ...codes.map((code, ix) => ({
          name: `${code}-stddev`,
          type: "custom",
          data: combinedData.map(d => {
            if (
              d.course_code[code]?.mean_mark === null ||
              d.course_code[code]?.mean_mark === undefined
            ) {
              return [d.academic_year, null, null];
            }

            const value = [
              d.academic_year,
              d.course_code[code].mean_mark -
                (d.course_code[code].std_deviation ?? 0),
              d.course_code[code].mean_mark +
                (d.course_code[code].std_deviation ?? 0),
            ];

            return value;
          }),
          renderItem: (params: any, api: any) => {
            const xValue = api.value(0);
            const yLow = api.value(1);
            const yHigh = api.value(2);
            // Show as error bars with one vertical and two horizontal lines
            if (yLow === null || yHigh === null) {
              return null; // No error bar if no data
            }
            const xCoord = api.coord([xValue, 0])[0];
            const yLowCoord = api.coord([0, yLow])[1];
            const yHighCoord = api.coord([0, yHigh])[1];
            const errorBarWidth = 10;

            const customStyle = api.style({
              stroke: colors[codes.indexOf(code) % colors.length].replace(
                "0.3",
                "0.8",
              ),
              lineWidth: 2,
              opacity: 0,
            });
            const emphasisStyle = {
              ...customStyle,
              opacity: 1,
            };
            return {
              type: "group",
              children: [
                {
                  type: "line",
                  shape: {
                    x1: xCoord,
                    y1: yLowCoord,
                    x2: xCoord,
                    y2: yHighCoord,
                  },
                  style: customStyle,
                  emphasis: {
                    style: emphasisStyle,
                  },
                },
                {
                  type: "line",
                  shape: {
                    x1: xCoord - errorBarWidth / 2,
                    y1: yLowCoord,
                    x2: xCoord + errorBarWidth / 2,
                    y2: yLowCoord,
                  },
                  style: customStyle,
                  emphasis: {
                    style: emphasisStyle,
                  },
                },
                {
                  type: "line",
                  shape: {
                    x1: xCoord - errorBarWidth / 2,
                    y1: yHighCoord,
                    x2: xCoord + errorBarWidth / 2,
                    y2: yHighCoord,
                  },
                  style: customStyle,
                  emphasis: {
                    style: emphasisStyle,
                  },
                },
              ],
            };
          },
        })),
      ],
    } as EChartsOption;
  }, [sortedYears, codes, combinedData, colors, chartRef]);

  // We keep a timeout for each series to delay the downplay action, so that the
  // stddev line doesn't disappear immediately when the mouse leaves the main
  // line. Important, since without this, stddev will flicker very quickly.
  const hoverTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  // Trigger highlight and downplay via events
  const handleEvents = useMemo(
    () =>
      ({
        mouseover: (params, chart) => {
          if (!params.seriesName?.endsWith("-stddev")) {
            const code = params.seriesName;
            if (hoverTimeouts.current[code]) {
              clearTimeout(hoverTimeouts.current[code]);
            }
            chart.dispatchAction({
              type: "highlight",
              seriesName: `${code}-stddev`,
            });
          }
        },
        mouseout: (params, chart) => {
          if (!params.seriesName?.endsWith("-stddev")) {
            const code = params.seriesName;
            if (hoverTimeouts.current[code]) {
              clearTimeout(hoverTimeouts.current[code]);
            }
            hoverTimeouts.current[code] = setTimeout(() => {
              chart.dispatchAction({
                type: "downplay",
                seriesName: `${code}-stddev`,
              });
            }, 1000);
          }
        },
      }) as EChartsEventsMap,
    [combinedData],
  );

  return (
    <EChartsCore
      {...props}
      echarts={echarts}
      option={chartOption}
      onEvents={handleEvents}
      replaceMerge="series"
      ref={setChartRef}
    />
  );
};

export default CategoryGradeStatChart;
