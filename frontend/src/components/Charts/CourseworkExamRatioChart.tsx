import React from "react";
import EChartsCore, { EChartsCoreProps } from "react-echarts-library/core";
import * as echarts from "echarts/core";
import type { EChartsOption } from "echarts";
import { PieChart } from "echarts/charts";
import { GridComponent, TitleComponent } from "echarts/components";
import { SVGRenderer } from "echarts/renderers";

echarts.use([PieChart, GridComponent, TitleComponent, SVGRenderer]);

const pieChartOptions = (cw_exam_ratio: number[]): EChartsOption => ({
  series: [
    {
      type: "pie",
      data: cw_exam_ratio,
      labelLine: { show: false },
      silent: true,
      radius: "100%",
      color: [
        "var(--mantine-primary-color-3)",
        "var(--mantine-primary-color-9)",
      ],
    },
  ],
});

interface CourseworkExamRatioChartProps {
  cw_exam_ratio: number[];
}

export const CourseworkExamRatioChart: React.FC<
  CourseworkExamRatioChartProps & Omit<EChartsCoreProps, "echarts" | "option">
> = ({ cw_exam_ratio, ...props }) => {
  return (
    <EChartsCore
      {...props}
      echarts={echarts}
      option={pieChartOptions(cw_exam_ratio)}
    />
  );
};

export default CourseworkExamRatioChart;
