import React from "react";
import { Title, Text, Stack, Anchor, Group } from "@mantine/core";
import { CourseworkExamRatioChart } from "../components/Charts/CourseworkExamRatioChart";

export const CategoryDRPSSession: React.FC<{
  euclid_codes: string[];
  sessionString: string;
  quickinfo_data:
    | {
        code: string;
        acronym: string;
        name: string;
        delivery_ordinal: number;
        credits: number;
        cw_exam_ratio: number[];
        course_url: string;
        euclid_url: string;
        level: number;
        shadow?: string;
      }[]
    | undefined[];
}> = ({ euclid_codes, quickinfo_data, sessionString }) => {
  return (
    <>
      <Title order={2} mb="lg">
        Info for {sessionString} run
      </Title>
      {quickinfo_data.length === 0 && (
        /*
        If none of the variants of this course are running this year,
        we show a message to the user.
      */ <Text c="dimmed" size="sm">
          This course is either not running this year or is not an Informatics
          course.
        </Text>
      )}
      {quickinfo_data.map((course, i) => (
        <Stack key={euclid_codes[i]} mb="sm" gap={0}>
          <Text>
            <Text span fw="bold">
              {euclid_codes[i]}
            </Text>
            {" - "}
            {course?.course_url && (
              <>
                <Anchor
                  href={course.course_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  c="blue"
                >
                  Course Page
                </Anchor>
                {", "}
              </>
            )}
            {course?.euclid_url && (
              <Anchor
                href={course.euclid_url}
                target="_blank"
                rel="noopener noreferrer"
                c="blue"
              >
                DRPS
              </Anchor>
            )}
          </Text>
          {course && (
            <>
              <Text>
                {course.name} ({course.acronym})<br />
                SCQF {course.level} / {course.credits} Credits / Semester{" "}
                {course.delivery_ordinal}
              </Text>
              <Group gap="xs">
                <CourseworkExamRatioChart
                  cw_exam_ratio={course.cw_exam_ratio}
                  style={{ height: 20, width: 20 }}
                />
                <Text>
                  {course.cw_exam_ratio[0] > 0 &&
                    `${course.cw_exam_ratio[0]}% Coursework`}
                  {course.cw_exam_ratio[0] > 0 &&
                    course.cw_exam_ratio[1] > 0 &&
                    " + "}
                  {course.cw_exam_ratio[1] > 0 &&
                    `${course.cw_exam_ratio[1]}% Exam`}
                </Text>
              </Group>
            </>
          )}
          {!course && (
            <Text c="dimmed">
              No course information available for this code.
            </Text>
          )}
        </Stack>
      ))}
    </>
  );
};
