import { Anchor, Box, Container, Text } from "@mantine/core";
import { useLocalStorageState } from "ahooks";
import React from "react";
import { Link } from "react-router-dom";
import {
  RECENT_EXAMS_KEY,
  RecentExam,
} from "../utils/recently-viewed-exams";

const RecentlyViewedExams: React.FC = () => {
  const [recentExams] = useLocalStorageState<RecentExam[]>(RECENT_EXAMS_KEY, []);

  if (!recentExams || recentExams.length === 0) return null;

  return (
    <Box pt="sm">
      <Container size="xl">
        <Text size="sm">
          <Text component="span" c="dimmed">Recently viewed: </Text>
          {recentExams.map((exam, i) => (
            <React.Fragment key={exam.filename}>
              {i > 0 && <Text component="span" c="dimmed"> / </Text>}
              <Anchor
                component={Link}
                to={`/exams/${exam.filename}`}
                size="sm"
              >
                {exam.category_displayname} {exam.displayname}
              </Anchor>
            </React.Fragment>
          ))}
        </Text>
      </Container>
    </Box>
  );
};
export default RecentlyViewedExams;
