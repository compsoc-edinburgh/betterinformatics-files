import React, { useMemo } from "react";

import {
  Alert,
  Box,
  Group,
  Paper,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";

import { useCourseStats } from "../api/hooks";
import { CourseStats } from "../interfaces";
import {
  CategoryGradeStatChart,
  ChartCourseStats,
} from "./Charts/CategoryGradeStatChart";

interface CategoryStatsProps {
  slug: string;
}

const CategoryStatsComponent: React.FC<CategoryStatsProps> = ({ slug }) => {
  const [error, loading, stats] = useCourseStats(slug);

  const { sortedYears, codes, combinedData } = useMemo(() => {
    if (!stats || stats.length === 0) {
      return { sortedYears: [], codes: [], combinedData: [] };
    }

    // Group stats by year and course code
    const yearGroups: Record<
      string,
      Record<string, CourseStats | undefined> | undefined
    > = {};
    const allCourseCodes = new Set<string>();

    stats.forEach(stat => {
      yearGroups[stat.academic_year] ??= {};

      // Mutable reference
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const yearGroup = yearGroups[stat.academic_year]!;
      const existingStat = yearGroup[stat.course_code];

      // collect a representative stat for every year-course pair, and extras
      if (!existingStat) {
        yearGroup[stat.course_code] = stat;
      } else {
        // If we already have a stat for this year-course pair, choose the one
        // with the earliest source_date while having 25/50/75 percentiles and mean;
        // if that doesn't exist, choose earliest with mean.
        const existingHasMean = existingStat.mean_mark !== null;
        const existingHasPercentiles = ["25", "50", "75"].every(
          p => existingStat.percentiles[p],
        );
        const statHasMean = stat.mean_mark !== null;
        const statHasPercentiles = ["25", "50", "75"].every(
          p => stat.percentiles[p],
        );
        if (
          (!existingHasMean && statHasMean) ||
          (existingHasMean &&
            statHasMean &&
            !existingHasPercentiles &&
            statHasPercentiles) ||
          (existingHasMean &&
            statHasMean &&
            existingHasPercentiles &&
            statHasPercentiles &&
            stat.source_date < existingStat.source_date)
        ) {
          yearGroup[stat.course_code] = stat;
        }
      }
      allCourseCodes.add(stat.course_code);
    });

    const sortedYears = Object.keys(yearGroups).sort();
    const codes = Array.from(allCourseCodes).sort();

    // Prepare data for chart
    const combinedData: ChartCourseStats[] = sortedYears.map(year => {
      const yearData: ChartCourseStats = {
        academic_year: year,
        course_code: {},
      };
      codes.forEach(code => {
        const stat = yearGroups[year]?.[code];
        if (stat?.mean_mark !== null && stat?.mean_mark !== undefined) {
          yearData.course_code[code] = {
            mean_mark: Number(stat.mean_mark.toFixed(1)),
            std_deviation: stat.std_deviation
              ? Number(stat.std_deviation.toFixed(1))
              : null,
            course_organiser: stat.course_organiser,
            organiser_changed:
              yearGroups[sortedYears[sortedYears.indexOf(year) - 1]]?.[code]
                ?.course_organiser !== stat.course_organiser ||
              yearGroups[sortedYears[sortedYears.indexOf(year) - 1]]?.[code]
                ?.mean_mark === null,
            percentiles: stat.percentiles,
          };
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
          <CategoryGradeStatChart
            sortedYears={sortedYears}
            codes={codes}
            combinedData={combinedData}
            style={{ height: 400 }}
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
