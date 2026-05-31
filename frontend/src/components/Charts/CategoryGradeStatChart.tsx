import React, { useMemo, useRef } from "react";
import EChartsCore, {
  EChartsReactRef,
  EChartsCoreProps,
} from "react-echarts-library/core";
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
import { useMantineTheme } from "@mantine/core";

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  CanvasRenderer,
  LabelLayout,
]);

interface CategoryGradeStatChartProps {
  sortedYears: string[];
  codes: string[];
  combinedData: any[];
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

  const chartRef = useRef<EChartsReactRef>(null);

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
      series: codes.map((code, ix) => ({
        name: code,
        type: "line",
        data: combinedData.map(d => {
          const value = [
            d["year"],
            d[code],
            d[`${code}_std`],
            d[`${code}_organiser`],
            d[`${code}_organiser_changed`],
          ];
          if (d[`${code}_organiser_changed`]) {
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
          formatter: (params: any) => {
            // Show only if course organizer changed
            const organiser = params.value[3];
            const organiserChanged = params.value[4];
            if (organiser && organiserChanged) {
              return `CO: ${organiser}`;
            }
            return undefined;
          },
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
            y: params.labelRect.y + (ix % 2 === 0 ? -30 : 30),
          };
        },
      })),
    } as EChartsOption;
  }, [sortedYears, codes, combinedData, colors]);
  return (
    <EChartsCore
      {...props}
      echarts={echarts}
      option={chartOption}
      replaceMerge="series"
    />
  );
};

export default CategoryGradeStatChart;
