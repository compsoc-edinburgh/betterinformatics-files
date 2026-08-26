import React, { useEffect, useMemo, useRef, useState } from "react";

import { useComputedColorScheme, useMantineTheme } from "@mantine/core";
import type {
  EChartsOption,
  LabelFormatterCallback,
  LabelLayoutOptionCallbackParams,
  TooltipComponentOption,
  TooltipComponentPositionCallbackParams,
  CustomSeriesRenderItemParams,
  CustomSeriesRenderItemAPI,
  CustomSeriesRenderItemReturn,
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
  EChartsReactRef,
} from "react-echarts-library/core";
import { useMediaQuery } from "@mantine/hooks";

// echarts doesn't export its custom element types >:(, so hack
type CustomElementOption = Extract<
  NonNullable<CustomSeriesRenderItemReturn>,
  { type: "group" }
>["children"][number];

// echarts doesn't expose this either :(
interface LegendSelectChangedEvent {
  name: string;
  selected: Record<string, boolean>;
}

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
  percentiles: Percentiles;
  course_organiser: string | null;
  organiser_changed: boolean;
}

interface Percentiles {
  "5"?: number;
  "25"?: number;
  "50"?: number;
  "75"?: number;
  "95"?: number;
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
  const mobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

  const [chartRef, setChartRef] = useState<EChartsReactRef | null>(null);

  // We keep a timeout for each series to delay the downplay action, so that the
  // stddev line doesn't disappear immediately when the mouse leaves the main
  // line. Important, since without this, stddev will flicker very quickly.
  const hoverTimeouts = useRef<Record<string, NodeJS.Timeout | undefined>>({});

  const selected = useRef<boolean[]>(
    new Array<boolean>(codes.length).fill(true),
  );

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

    chart.on("legendselectchanged", params => {
      const event = params as LegendSelectChangedEvent;
      const selectedCode = event.name;
      const selectedIndex = codes.indexOf(selectedCode);
      if (selectedIndex !== -1) {
        selected.current[selectedIndex] = event.selected[selectedCode];
      }
    });

    chart.getZr().on("mousemove", e => {
      // Get the pixel position of the mouse event
      const pixelPoint = [e.offsetX, e.offsetY];
      // Get on grid
      const gridPoint = chart.convertFromPixel({ seriesIndex: 0 }, pixelPoint);

      // Get nearest x-axis value (academic year) from the grid point
      const xValue = gridPoint[0];
      const nearestYearIndex = Math.round(xValue);
      const secondNearestYearIndex =
        xValue < nearestYearIndex ? nearestYearIndex + 1 : nearestYearIndex - 1;

      // Get nearest course code based on the y-axis value
      const yValue = gridPoint[1];
      const results = codes.reduce(
        (indices, code, index) => {
          if (!selected.current[index]) {
            return indices; // Skip if not selected
          }
          const seriesData = combinedData.map(
            d => d.course_code[code]?.mean_mark,
          );
          const seriesYValue = seriesData[nearestYearIndex];
          const seriesSecondYValue =
            secondNearestYearIndex >= 0 &&
            secondNearestYearIndex < seriesData.length
              ? seriesData[secondNearestYearIndex]
              : null;

          const distance =
            seriesYValue === null || seriesYValue === undefined
              ? Infinity
              : Math.abs(seriesYValue - yValue);
          const secondDistance =
            seriesSecondYValue === null || seriesSecondYValue === undefined
              ? Infinity
              : Math.abs(seriesSecondYValue - yValue);

          if (distance < indices[0]) {
            indices[0] = distance;
            indices[2] = index;
          }
          if (secondDistance < indices[1]) {
            indices[1] = secondDistance;
            indices[3] = index;
          }
          return indices;
        },
        [Infinity, Infinity, -1, -1],
      );
      let nearestCodeIndex = results[2];
      const nearestCodeIndexOnSecondNearestColumn = results[3];

      // const nearestPointsCodes = combinedData
      //   .map(d => {
      //     const codeValues = Object.entries(d.course_code).map(([code, stats]) => ({
      //       year_index: sortedYears.indexOf(d.academic_year) ,
      //       code,
      //       mean_mark: stats?.mean_mark ?? null,
      //     }));
      //     return codeValues;
      //   })
      //   .flat()
      //   .filter(d => d.mean_mark !== null)
      //   .sort((a, b) => Math.abs(a.mean_mark - yValue) - Math.abs(b.mean_mark - yValue))
      //   .slice(0, 2)
      //   .map(d => d.code);
      // const sortedCodesByProximity = codes.toSorted((a, b) => {
      //   const seriesDataA = combinedData.map(
      //     d => d.course_code[a]?.mean_mark,
      //   );
      //   const seriesDataB = combinedData.map(
      //     d => d.course_code[b]?.mean_mark,
      //   );
      //   const seriesYValueA = seriesDataA[nearestYearIndex];
      //   const seriesYValueB = seriesDataB[nearestYearIndex];
      //   return (
      //     (seriesYValueA === null || seriesYValueA === undefined
      //       ? Infinity
      //       : Math.abs(seriesYValueA - yValue)) -
      //     (seriesYValueB === null || seriesYValueB === undefined
      //       ? Infinity
      //       : Math.abs(seriesYValueB - yValue))
      //   );
      // });
      // let nearestCodeIndex = codes.findIndex(code => code === nearestPointsCodes[0]);

      // Override if previously hovered code still exists on this year
      // Determine previously hovered code by if there is a single item without
      // a timer entry
      // And do not override if two closest points agree on a different course
      if (
        Object.values(hoverTimeouts.current).filter(Boolean).length ===
        codes.length - 1
      ) {
        const lastHoveredIndex = codes.findIndex(
          code => !hoverTimeouts.current[code],
        );
        if (
          lastHoveredIndex !== -1 &&
          nearestCodeIndex !== nearestCodeIndexOnSecondNearestColumn
        ) {
          const lastHoveredCode = codes[lastHoveredIndex];
          const seriesData = combinedData.map(
            d => d.course_code[lastHoveredCode]?.mean_mark,
          );
          const seriesYValue = seriesData[nearestYearIndex];
          if (seriesYValue !== null && seriesYValue !== undefined) {
            nearestCodeIndex = lastHoveredIndex;
          }
        }
      }

      if (nearestCodeIndex === -1) return;

      const nearestCode = codes[nearestCodeIndex];

      if (hoverTimeouts.current[nearestCode]) {
        clearTimeout(hoverTimeouts.current[nearestCode]);
        hoverTimeouts.current[nearestCode] = undefined;
      }

      // Highlight the nearest course code series
      chart.dispatchAction({
        type: "highlight",
        seriesName: nearestCode,
      });
      // And its stddev series
      chart.dispatchAction({
        type: "highlight",
        seriesName: `${nearestCode}-stddev`,
      });
      // And its area
      chart.dispatchAction({
        type: "highlight",
        seriesName: `${nearestCode}-stddev-area`,
      });

      // For all other course codes, downplay them and their stddev series in
      // 0.1 second
      codes.forEach(code => {
        if (code !== nearestCode && !hoverTimeouts.current[code]) {
          hoverTimeouts.current[code] = setTimeout(() => {
            chart.dispatchAction({
              type: "downplay",
              seriesName: code,
            });
            chart.dispatchAction({
              type: "downplay",
              seriesName: `${code}-stddev`,
            });
            chart.dispatchAction({
              type: "downplay",
              seriesName: `${code}-stddev-area`,
            });
          }, 100);
        }
      });
    });
    chart.getZr().on("mouseout", () => {
      // All series downplay after 0.1 second
      codes.forEach(code => {
        hoverTimeouts.current[code] ??= setTimeout(() => {
          chart.dispatchAction({
            type: "downplay",
            seriesName: code,
          });
          chart.dispatchAction({
            type: "downplay",
            seriesName: `${code}-stddev`,
          });
          chart.dispatchAction({
            type: "downplay",
            seriesName: `${code}-stddev-area`,
          });
        }, 100);
      });
    });
  }, [scheme, chartRef, codes, combinedData]);

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
          _dom,
          _rect,
          size,
        ) => {
          if (!Array.isArray(params)) params = [params];

          // Position at nearest x-axis item, constant y-axis pos
          const xIndex = params[0].dataIndex;
          const cursorY = 20 - size.contentSize[1];

          const gridX = chartRef
            ?.getEchartsInstance()
            ?.convertToPixel({ xAxisIndex: 0 }, 0);
          if (gridX === undefined) {
            return { left: point[0], top: cursorY }; // Fallback to cursor X
          }

          const gridXEnd = chartRef
            ?.getEchartsInstance()
            ?.convertToPixel({ xAxisIndex: 0 }, sortedYears.length - 1);
          if (gridXEnd === undefined) {
            return { left: point[0], top: cursorY }; // Fallback to cursor X
          }
          const gridW = gridXEnd - gridX;

          const xPos =
            gridX +
            (xIndex / (sortedYears.length - 1)) * gridW -
            size.contentSize[0] / 2;

          return { left: xPos, top: cursorY };
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
              string | number | boolean | null | undefined
            )[];
            if (value[1] === null || value[1] === undefined) {
              // Skip if mean mark is not available
              return;
            }
            // Or if name ends with "-stddev" (for custom error bar series)
            if (
              param.seriesName?.endsWith("-stddev") ||
              param.seriesName?.endsWith("-stddev-area") ||
              param.seriesName?.endsWith("-stddev-lower")
            ) {
              return;
            }
            const code = param.seriesName;
            const meanMark = value[1];
            const stdDev = value[2];
            const organiser = value[3];
            const color = param.color as string;
            tooltip += `<span><span style="color: ${color}">\u25CF</span> <strong>${code}</strong>: μ ${meanMark}%, σ ${stdDev}%</span>`;
            if (organiser) {
              tooltip += `<span style="color:var(--mantine-color-dimmed)">CO: ${organiser}</span>`;
            }
          });
          tooltip += "</div>";
          return tooltip;
        },
      } as TooltipComponentOption,
      series: [
        // Lower standard deviation bound line
        ...codes.map((code, _ix) => ({
          name: `${code}-stddev-lower`,
          type: "line",
          silent: true,
          triggerEvent: false,
          stack: `${code}-stddev`,
          data: combinedData.map(d => {
            if (
              d.course_code[code]?.mean_mark === null ||
              d.course_code[code]?.mean_mark === undefined
            ) {
              return null;
            }
            return [
              d.academic_year,
              d.course_code[code].mean_mark -
                (d.course_code[code].std_deviation ?? 0),
            ];
          }),
          itemStyle: {
            opacity: 0,
          },
          lineStyle: {
            opacity: 0,
          },
          emphasis: {
            disabled: true,
          },
        })),
        ...codes.map((code, _ix) => ({
          name: `${code}-stddev-area`,
          type: "line",
          silent: true,
          triggerEvent: false,
          stack: `${code}-stddev`,
          stackStrategy: "all",
          data: combinedData.map(d => {
            if (
              d.course_code[code]?.mean_mark === null ||
              d.course_code[code]?.mean_mark === undefined
            ) {
              return null;
            }
            return [
              d.academic_year,
              2 * (d.course_code[code].std_deviation ?? 0),
            ];
          }),
          itemStyle: {
            opacity: 0,
          },
          lineStyle: {
            opacity: 0,
          },
          areaStyle: {
            opacity: 0,
            color: colors[codes.indexOf(code) % colors.length].replace(
              "0.3",
              "0.8",
            ),
          },
          emphasis: {
            areaStyle: {
              opacity: 0.2,
            },
          },
        })),
        // Main line series for each course code
        ...codes.map((code, ix) => ({
          name: code,
          type: "line",
          silent: true,
          triggerEvent: false,
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
            opacity: 1,
          },
          itemStyle: {
            color: colors[codes.indexOf(code) % colors.length].replace(
              "0.3",
              "0.8",
            ),
            opacity: 1,
          },
          emphasis: {
            itemStyle: {
              opacity: 1,
            },
            lineStyle: {
              width: 4,
              color: colors[codes.indexOf(code) % colors.length].replace(
                "0.3",
                "1.0",
              ),
              opacity: 1,
            },
            label: {
              opacity: 1,
            },
          },
          label: {
            formatter: (params => {
              if (!params.value) return undefined;
              const value = params.value as (
                string | number | boolean | null | undefined
              )[];
              // Show only if course organizer changed
              const organiser = value[3];
              const organiserChanged = value[4];
              if (organiser !== null && organiserChanged) {
                return `${organiser}`;
              }
              return undefined;
            }) as LabelFormatterCallback,
            position: ix % 2 === 0 ? "top" : "bottom",
            align: "left",
            color: colors[codes.indexOf(code) % colors.length].replace(
              "0.3",
              "0.8",
            ),
            opacity: mobile ? 0 : 1,
            silent: true,
          },
          labelLine: {
            show: !mobile,
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
        ...codes.map((code, _ix) => ({
          name: `${code}-stddev`,
          type: "custom",
          data: combinedData.map(d => [d.academic_year]),
          renderItem: (
            _params: CustomSeriesRenderItemParams,
            api: CustomSeriesRenderItemAPI,
          ) => {
            const xValue = api.value(0);
            // lookup directly from data since string JSON can't be passed
            // through data -> renderItem
            const yPercentiles =
              combinedData[_params.dataIndex]?.course_code[code]?.percentiles;
            if (!yPercentiles) {
              return null;
            }

            const percentileLength = 10;

            // We can't replicate the behaviour of .style() with other funcs:
            // https://github.com/apache/echarts/issues/16514
            // eslint-disable-next-line @typescript-eslint/no-deprecated
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

            const returnVal = {
              type: "group",
              children: [] as CustomElementOption[],
            };

            // Optionally, if percentile lines exist, add them
            for (const [key, percentile] of Object.entries(yPercentiles)) {
              if (percentile !== null) {
                const xCoord = api.coord([xValue, 0])[0];
                const yPercentileCoord = api.coord([0, percentile])[1];
                let len = percentileLength;
                // shorter for 5th and 95th percentiles
                if (key === "5" || key === "95") {
                  len = percentileLength / 3;
                }
                returnVal.children.push({
                  type: "line",
                  shape: {
                    x1: xCoord - len / 2,
                    y1: yPercentileCoord,
                    x2: xCoord + len / 2,
                    y2: yPercentileCoord,
                  },
                  style: customStyle,
                  emphasis: {
                    style: emphasisStyle,
                  },
                });
              }
            }

            return returnVal;
          },
        })),
      ],
    } as EChartsOption;
  }, [sortedYears, codes, combinedData, colors, chartRef, mobile]);

  return (
    <EChartsCore
      {...props}
      echarts={echarts}
      option={chartOption}
      replaceMerge="series"
      ref={setChartRef}
    />
  );
};

export default CategoryGradeStatChart;
