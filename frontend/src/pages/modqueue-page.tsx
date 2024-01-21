import { useRequest } from "@umijs/hooks";
import {
  Anchor,
  Badge,
  Button,
  Container,
  Table,
  Text,
  Title,
} from "@mantine/core";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { CategoryExam } from "../interfaces";
import { fetchGet, fetchPost } from "../api/fetch-utils";
import useTitle from "../hooks/useTitle";
import useConfirm from "../hooks/useConfirm";
import ClaimButton from "../components/claim-button";
import CourseMetadataChecker from "../components/course-metadata-checker";
import IconButton from "../components/icon-button";
import LoadingOverlay from "../components/loading-overlay";
import { ICONS } from "vseth-canine-ui";

const loadExams = async (includeHidden: boolean) => {
  return (
    await fetchGet(
      `/api/exam/listimportexams/${includeHidden ? "?includehidden=true" : ""}`,
    )
  ).value as CategoryExam[];
};
const removeExam = async (filename: string) => {
  await fetchPost(`/api/exam/remove/exam/${filename}/`, {});
};
const loadFlagged = async () => {
  return (await fetchGet("/api/exam/listflagged/")).value as string[];
};

const ModQueue: React.FC = () => {
  useTitle("Import Queue");
  const [includeHidden, setIncludeHidden] = useState(false);
  const {
    error: examsError,
    loading: examsLoading,
    data: exams,
    run: reloadExams,
  } = useRequest(() => loadExams(includeHidden), {
    refreshDeps: [includeHidden],
  });
  const { error: flaggedError, data: flaggedAnswers } = useRequest(loadFlagged);

  const error = examsError || flaggedError;

  const [confirm, modals] = useConfirm();
  const { run: runRemoveExam } = useRequest(removeExam, {
    manual: true,
    onSuccess: reloadExams,
  });
  const handleRemoveClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    exam: CategoryExam,
  ) => {
    e.stopPropagation();
    confirm(
      `Remove the exam named ${exam.displayname}? This will remove all answers and can not be undone!`,
      () => runRemoveExam(exam.filename),
    );
  };

  return (
    <Container size="xl">
      {flaggedAnswers && flaggedAnswers.length > 0 && (
        <div>
          <Title order={2} mb="md">
            Flagged Answers
          </Title>
          {flaggedAnswers.map(answer => (
            <div key={answer}>
              <Link to={answer} target="_blank" rel="noopener noreferrer">
                {answer}
              </Link>
            </div>
          ))}
        </div>
      )}
      <Title my="sm" order={2}>
        Import Queue
      </Title>
      <Text>
        Here you can see exams that have been uploaded for categories that you
        are an admin for. Click claim to claim an exam to start working on it
        (add cuts, make it public, rename if necessary) to prevent race
        conditions. After 4 hours, the claim will release.
      </Text>
      {error && <div>{error.message}</div>}
      {modals}
      <div>
        <LoadingOverlay visible={examsLoading} />
        <Table striped fontSize="md">
          <thead>
            <tr>
              <th>Category</th>
              <th>Name</th>
              <th>Import State</th>
              <th>Claim</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {exams &&
              exams.map((exam: CategoryExam) => (
                <tr key={exam.filename}>
                  <td>{exam.category_displayname}</td>
                  <td>
                    <Anchor
                      color="blue"
                      component={Link}
                      to={`/exams/${exam.filename}`}
                      target="_blank"
                    >
                      {exam.displayname}
                    </Anchor>
                    <div>
                      {exam.public && <Badge color="green">public</Badge>}
                      {!exam.public && <Badge color="orange">hidden</Badge>}
                    </div>
                    <p>{exam.remark}</p>
                  </td>
                  <td>{exam.finished_cuts ? "All done" : "Needs Cuts"}</td>
                  <td>
                    <ClaimButton exam={exam} reloadExams={reloadExams} />
                  </td>
                  <td>
                    <IconButton
                      size="lg"
                      color="gray.6"
                      tooltip="Delete exam"
                      iconName={ICONS.DELETE}
                      variant="outline"
                      onClick={(
                        e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
                      ) => handleRemoveClick(e, exam)}
                    />
                  </td>
                </tr>
              ))}
          </tbody>
        </Table>
      </div>
      <Button mt="sm" mb="xl" onClick={() => setIncludeHidden(!includeHidden)}>
        {includeHidden ? "Hide" : "Show"} Complete Hidden Exams
      </Button>
      <Title my="sm" order={2}>
        Course Checker
      </Title>
      <Text>
        The following courses are apparently running according to the official
        course list but are missing from the categories data. Please associate
        them to the correct categories if required. You can ignore courses that
        are "dissertations", "group projects", "seminars" etc where past exams
        and revision notes wouldn't be very helpful for (unless its addition is
        requested by students).
      </Text>
      <CourseMetadataChecker />
    </Container>
  );
};
export default ModQueue;
