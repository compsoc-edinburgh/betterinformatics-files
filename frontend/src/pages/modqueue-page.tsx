import { useRequest } from "@umijs/hooks";
import {
  Anchor,
  Badge,
  Button,
  Container,
  Table,
  Text,
  Group,
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
import { IconTrash } from "@tabler/icons-react";

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
  const error = examsError;

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
        <Table fz="md">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Category</Table.Th>
              <Table.Th>Name</Table.Th>
              <Table.Th>Import State</Table.Th>
              <Table.Th>Claim</Table.Th>
              <Table.Th>Delete</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {exams &&
              exams.map((exam: CategoryExam) => (
                <Table.Tr key={exam.filename}>
                  <Table.Td>{exam.category_displayname}</Table.Td>
                  <Table.Td>
                    <Group>
                      <Anchor
                        c="blue"
                        component={Link}
                        to={`/exams/${exam.filename}`}
                        target="_blank"
                      >
                        {exam.displayname}
                      </Anchor>
                      {exam.public && <Badge color="green">public</Badge>}
                      {!exam.public && <Badge color="orange">hidden</Badge>}
                      <p>{exam.remark}</p>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    {exam.finished_cuts ? "All done" : "Needs Cuts"}
                  </Table.Td>
                  <Table.Td>
                    <ClaimButton exam={exam} reloadExams={reloadExams} />
                  </Table.Td>
                  <Table.Td>
                    <IconButton
                      size="lg"
                      color="gray.6"
                      tooltip="Delete exam"
                      icon={<IconTrash />}
                      variant="outline"
                      onClick={(
                        e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
                      ) => handleRemoveClick(e, exam)}
                    />
                  </Table.Td>
                </Table.Tr>
              ))}
          </Table.Tbody>
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
