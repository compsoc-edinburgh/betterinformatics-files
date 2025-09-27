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

  // Create a color mapping for course organisers
  const courseOrganiserColors = useMemo(() => {
    if (!stats) return {};
    
    const uniqueOrganisers = [...new Set(stats.map(s => s.course_organiser).filter(Boolean))];
    const colors = [
      "rgba(34, 139, 34, 0.3)",   // Forest Green
      "rgba(30, 144, 255, 0.3)",  // Dodger Blue  
      "rgba(255, 140, 0, 0.3)",   // Dark Orange
      "rgba(147, 112, 219, 0.3)", // Medium Slate Blue
      "rgba(220, 20, 60, 0.3)",   // Crimson
    ];
    
    const mapping: { [key: string]: string } = {};
    uniqueOrganisers.forEach((organiser, index) => {
      if (organiser) {
        mapping[organiser] = colors[index % colors.length];
      }
    });
    return mapping;
  }, [stats]);

  const { chartData, courseCodes, referenceLines } = useMemo(() => {
    if (!stats || stats.length === 0) {
      return { chartData: [], courseCodes: [], referenceLines: [] };
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
          // Store organiser for tooltip
          yearData[`${code}_organiser`] = stat.course_organiser;
        }
      });
      return yearData;
    });

    // Generate reference lines for course organiser changes
    const refLines: Array<{ x: string; label: string; color: string }> = [];
    
    codes.forEach(code => {
      const courseStats = stats
        .filter(s => s.course_code === code)
        .sort((a, b) => a.academic_year.localeCompare(b.academic_year));

      if (courseStats.length === 0) return;

      // Add reference line for the initial organiser
      const firstStat = courseStats[0];
      if (firstStat?.course_organiser) {
        const initialLabel = `${code}: ${firstStat.course_organiser}`;
        const initialColor = courseOrganiserColors[firstStat.course_organiser] 
          ? courseOrganiserColors[firstStat.course_organiser].replace('0.3', '0.8')
          : 'gray.6';

        refLines.push({
          x: firstStat.academic_year,
          label: initialLabel,
          color: initialColor,
        });
      }

      let previousOrganiser = firstStat?.course_organiser;

      courseStats.forEach((stat, index) => {
        if (index > 0 && stat.course_organiser !== previousOrganiser) {
          // Course organiser changed in this year
          const changeLabel = `${code}: ${stat.course_organiser}`;
          const changeColor = courseOrganiserColors[stat.course_organiser || ''] 
            ? courseOrganiserColors[stat.course_organiser || ''].replace('0.3', '0.8')
            : 'gray.6';

          // For the last year, position the label to the left to avoid overflow
          const isLastYear = index === courseStats.length - 1;
          const labelPosition = isLastYear ? 'left' : 'right';

          refLines.push({
            x: stat.academic_year,
            label: changeLabel,
            color: changeColor,
            labelPosition: labelPosition,
          });
        }
        previousOrganiser = stat.course_organiser;
      });
    });

    return {
      chartData: combinedData,
      courseCodes: codes,
      referenceLines: refLines,
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
          Hover over data points to see mean marks, standard deviation, and course organiser information.
          Vertical lines mark course organiser changes.
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
            referenceLines={referenceLines}
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
                        
                        // Get the standard deviation and organiser for this course and year
                        const dataPoint = chartData.find(d => d.year === label);
                        const stdDev = dataPoint ? dataPoint[`${courseCode}_std`] : null;
                        const organiser = dataPoint ? dataPoint[`${courseCode}_organiser`] : null;
                        
                        return (
                          <Box key={index}>
                            <Text size="sm" style={{ color: entry.color }}>
                              {courseCode}: {Number(meanMark).toFixed(1)}%
                            </Text>
                            {organiser && (
                              <Text size="xs" c="dimmed">
                                CO: <Text span style={{ color: courseOrganiserColors[organiser]?.replace('0.3', '1.0') || 'inherit' }}>
                                  {organiser}
                                </Text>
                              </Text>
                            )}
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
        
        {/* Course Organiser Information */}
        {Object.keys(courseOrganiserColors).length > 0 && (
          <Box mt="md">
            <Text size="sm" fw={500} mb="xs">Course Organisers Found:</Text>
            <Group gap="md">
              {Object.entries(courseOrganiserColors).map(([organiser, color]) => (
                <Group key={organiser} gap="xs">
                  <Box
                    w={16}
                    h={16}
                    style={{
                      backgroundColor: color.replace('0.3', '0.8'),
                      borderRadius: 3,
                    }}
                  />
                  <Text size="xs">{organiser}</Text>
                </Group>
              ))}
            </Group>
            <Text size="xs" c="dimmed" mt="xs">
              All course organisers found in the data. Hover on different chart points to see which organiser ran each course in specific years - organisers change over time!
            </Text>
          </Box>
        )}
      </Box>

      {stats && stats.length > 0 && (
        <Box>
          <Title order={3} mb="md">
            Course Overview
          </Title>
          <Group gap="md">
            {[...new Set(stats.map(s => s.course_code))].sort().map(code => {
              const courseStats = stats.filter(s => s.course_code === code);
              const latestStat = courseStats
                .sort((a, b) => a.academic_year.localeCompare(b.academic_year))
                .pop();
              
              return (
                <Paper key={code} withBorder p="md" style={{ minWidth: 200 }}>
                  <Stack gap="xs">
                    <Text fw={600} size="sm">{code}</Text>
                    <Text size="xs" c="dimmed">{latestStat?.course_name}</Text>
                    {latestStat?.course_organiser && (
                      <Text size="xs" c="dimmed">
                        CO: {latestStat.course_organiser}
                      </Text>
                    )}
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