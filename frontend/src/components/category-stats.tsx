import React, { useMemo } from "react";

import {
  Alert,
  Box,
  Group,
  Paper,
  Skeleton,
  Stack,
  Table,
  Tabs,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";

import { useCourseStats } from "../api/hooks";
import { CourseStats } from "../interfaces";
import {
  CategoryGradeStatChart,
  ChartCourseStats,
} from "./Charts/CategoryGradeStatChart";
import { IconCalendarMonth } from "@tabler/icons-react";

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
            course_name: stat.course_name,
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
          <li>No statistics are available for this course</li>
          <li>
            Better Informatics isn't aware of the correct EUCLID codes for this
            course
          </li>
          <li>Or your network is quite slow and data is still pending</li>
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
          The chart shows the mean marks (μ) of each course variant over time.
          Hover over the lines to see the 1 standard deviation (σ) range as
          shaded areas. Depending on data availability, we also show percentile
          data as horizontal bars. One in the center shows the 50th percentile
          i.e. the median. If 25th/75th percentiles exist, we show them and
          complete the full box plot. 5/95th percentiles get shown as simple
          bars outside the box if they exist.
        </Text>
        <Paper withBorder p="md" mb="md">
          <CategoryGradeStatChart
            sortedYears={sortedYears}
            codes={codes}
            combinedData={combinedData}
            style={{ height: 400 }}
          />
        </Paper>
        <Text size="sm" c="dimmed" mb="md">
          Source(s):{" "}
          {Array.from(new Set(stats.map(stat => stat.source_name))).join(", ")}
        </Text>
        <Text size="sm" c="dimmed" mb="md">
          Where multiple statistics exist for a course variant in a given year,
          we show the earliest complete one, as later statistics may include
          resits or dropouts that skew data.
        </Text>
      </Box>

      {stats.length > 0 && (
        <Box>
          <Title order={3} mb="md">
            Dataset
          </Title>
          <Tabs
            variant="outline"
            defaultValue={
              stats.toSorted((a, b) =>
                b.academic_year.localeCompare(a.academic_year),
              )[0].course_code
            }
          >
            <Tabs.List>
              {codes.map(code => (
                <Tabs.Tab key={code} value={code}>
                  {code}
                </Tabs.Tab>
              ))}
            </Tabs.List>
            {codes.map(code => (
              <Tabs.Panel key={code} value={code} style={{ overflowX: "auto" }}>
                <Table layout="fixed">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th w="5em">Year (source)</Table.Th>
                      <Table.Th w="10em">Organiser</Table.Th>
                      <Table.Th w="2em" title="Student Count">
                        n
                      </Table.Th>
                      <Table.Th w="2em" title="Mean Mark">
                        μ
                      </Table.Th>
                      <Table.Th w="2em" title="Standard Deviation">
                        σ
                      </Table.Th>
                      <Table.Th w="2em" title="5th Percentile">
                        P<sub>5</sub>
                      </Table.Th>
                      <Table.Th w="2em" title="25th Percentile">
                        P<sub>25</sub>
                      </Table.Th>
                      <Table.Th w="2em" title="50th Percentile">
                        P<sub>50</sub>
                      </Table.Th>
                      <Table.Th w="2em" title="75th Percentile">
                        P<sub>75</sub>
                      </Table.Th>
                      <Table.Th w="2em" title="95th Percentile">
                        P<sub>95</sub>
                      </Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {stats
                      .filter(s => s.course_code === code)
                      .toReversed()
                      .map(stat => (
                        <Table.Tr key={stat.academic_year}>
                          <Table.Td>
                            <Group gap="xs">
                              {stat.academic_year}
                              <Tooltip
                                label={`From ${stat.source_name} on ${new Date(stat.source_date).toLocaleDateString()}`}
                                withArrow
                              >
                                <IconCalendarMonth
                                  size={16}
                                  color="var(--mantine-color-dimmed)"
                                />
                              </Tooltip>
                            </Group>
                          </Table.Td>
                          <Table.Td>{stat.course_organiser}</Table.Td>
                          <Table.Td>
                            {stat.student_count ?? <Text c="dimmed">N/A</Text>}
                          </Table.Td>
                          <Table.Td>
                            {stat.mean_mark?.toFixed(1) ?? (
                              <Text c="dimmed">N/A</Text>
                            )}
                          </Table.Td>
                          <Table.Td>
                            {stat.std_deviation?.toFixed(1) ?? (
                              <Text c="dimmed">N/A</Text>
                            )}
                          </Table.Td>
                          <Table.Td>
                            {stat.percentiles["5"]?.toFixed(1) ?? (
                              <Text c="dimmed">N/A</Text>
                            )}
                          </Table.Td>
                          <Table.Td>
                            {stat.percentiles["25"]?.toFixed(1) ?? (
                              <Text c="dimmed">N/A</Text>
                            )}
                          </Table.Td>
                          <Table.Td>
                            {stat.percentiles["50"]?.toFixed(1) ?? (
                              <Text c="dimmed">N/A</Text>
                            )}
                          </Table.Td>
                          <Table.Td>
                            {stat.percentiles["75"]?.toFixed(1) ?? (
                              <Text c="dimmed">N/A</Text>
                            )}
                          </Table.Td>
                          <Table.Td>
                            {stat.percentiles["95"]?.toFixed(1) ?? (
                              <Text c="dimmed">N/A</Text>
                            )}
                          </Table.Td>
                        </Table.Tr>
                      ))}
                  </Table.Tbody>
                </Table>
              </Tabs.Panel>
            ))}
          </Tabs>
        </Box>
      )}
    </Stack>
  );
};

export default CategoryStatsComponent;
