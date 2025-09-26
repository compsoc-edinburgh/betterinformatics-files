import React, { useMemo } from "react";
import { Alert, Box, Group, Paper, Skeleton, Stack, Text, Title } from "@mantine/core";
import { LineChart } from "@mantine/charts";
import { useCourseStats } from "../api/hooks";
import { CourseStats } from "../interfaces";

interface CategoryStatsProps {
  slug: string;
}


const CategoryStatsComponent: React.FC<CategoryStatsProps> = ({ slug }) => {
  const [error, loading, stats] = useCourseStats(slug);

  const { chartData, courseCodes } = useMemo(() => {
    if (!stats || stats.length === 0) {
      return { chartData: [], courseCodes: [] };
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
          yearData[`${code}_std`] = stat?.std_deviation ? Number(stat.std_deviation.toFixed(1)) : null;
        }
      });
      return yearData;
    });

    return {
      chartData: combinedData,
      courseCodes: codes,
    };
  }, [stats]);

  // Colors for different course codes
  const colors = [
    "var(--mantine-primary-color-6)",
    "var(--mantine-color-blue-6)",
    "var(--mantine-color-green-6)",
    "var(--mantine-color-yellow-6)",
    "var(--mantine-color-red-6)",
    "var(--mantine-color-violet-6)",
    "var(--mantine-color-orange-6)",
    "var(--mantine-color-teal-6)",
  ];

  if (loading) {
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
        No grade statistics are available for this category. This may be because:
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
          Course Marks Over Time
        </Title>
        <Text size="sm" c="dimmed" mb="md">
          Hover over data points to see mean marks and standard deviation.
        </Text>
        <Paper withBorder p="md">
          <LineChart
            h={400}
            data={chartData}
            dataKey="year"
            series={courseCodes.map((code, index) => ({
              name: code,
              color: colors[index % colors.length],
              strokeWidth: 2,
            }))}
            curveType="linear"
            withLegend
            withTooltip
            withDots
            gridAxis="xy"
            yAxisProps={{
              domain: [0, 100],
              tickFormatter: (value) => `${Math.round(value)}%`,
            }}
            tooltipProps={{
              content: ({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <Paper p="sm" withBorder shadow="md">
                      <Text size="sm" fw={600} mb="xs">{label}</Text>
                      {payload.map((entry: any, index: number) => {
                        const courseCode = entry.dataKey;
                        const meanMark = entry.value;
                        
                        // Get the standard deviation for this course and year
                        const dataPoint = chartData.find(d => d.year === label);
                        const stdDev = dataPoint ? dataPoint[`${courseCode}_std`] : null;
                        
                        return (
                          <Box key={index}>
                            <Text size="sm" style={{ color: entry.color }}>
                              {courseCode}: {Number(meanMark).toFixed(1)}%
                            </Text>
                            {stdDev && (
                              <Text size="xs" c="dimmed">
                                Standard deviation: ±{stdDev}%
                              </Text>
                            )}
                          </Box>
                        );
                      })}
                    </Paper>
                  );
                }
                return null;
              },
            }}
          />
        </Paper>
      </Box>

      {courseCodes.length > 0 && (
        <Box>
          <Title order={3} mb="md">
            Course Overview
          </Title>
          <Group gap="md">
            {courseCodes.map(code => {
              const courseStats = stats.filter(s => s.course_code === code);
              const latestStat = courseStats[courseStats.length - 1];
              
              return (
                <Paper key={code} withBorder p="md" style={{ minWidth: 200 }}>
                  <Stack gap="xs">
                    <Text fw={600} size="sm">{code}</Text>
                    <Text size="xs" c="dimmed">{latestStat?.course_name}</Text>
                    {latestStat?.mean_mark && (
                      <Text size="sm">
                        Latest Mean: <Text span fw={500}>{latestStat.mean_mark.toFixed(1)}%</Text>
                      </Text>
                    )}
                    {latestStat?.std_deviation && (
                      <Text size="sm" c="dimmed">
                        Std Dev: ±{latestStat.std_deviation.toFixed(1)}%
                      </Text>
                    )}
                    <Text size="xs" c="dimmed">
                      {courseStats.length} year{courseStats.length !== 1 ? 's' : ''} of data
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