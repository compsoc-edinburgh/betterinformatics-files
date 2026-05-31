import React from "react";
import EChartsCore, { EChartsCoreProps } from "react-echarts-library/core";
import * as echarts from "echarts/core";
import type { EChartsOption } from "echarts";
import { PieChart } from "echarts/charts";
import { GridComponent, TitleComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { MantineColorsTuple, useMantineTheme } from "@mantine/core";

echarts.use([PieChart, GridComponent, TitleComponent, CanvasRenderer]);

const pieChartOptions = (
  cw_exam_ratio: number[],
  colors: MantineColorsTuple,
): EChartsOption => ({
  series: [
    {
      type: "pie",
      data: cw_exam_ratio,
      labelLine: { show: false },
      silent: true,
      radius: "100%",
      color: [colors[3], colors[9]],
    },
  ],
});

interface CourseworkExamRatioChartProps {
  cw_exam_ratio: number[];
}

export const CourseworkExamRatioChart: React.FC<
  CourseworkExamRatioChartProps & Omit<EChartsCoreProps, "echarts" | "option">
> = ({ cw_exam_ratio, ...props }) => {
  const theme = useMantineTheme();

  return (
    <EChartsCore
      {...props}
      echarts={echarts}
      option={pieChartOptions(cw_exam_ratio, theme.colors[theme.primaryColor])}
    />
  );
};

export default CourseworkExamRatioChart;
