import { useRequest } from "ahooks";
import {
  Anchor,
  Badge,
  Button,
  Container,
  Group,
  Table,
  Title,
} from "@mantine/core";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { fetchGet } from "../api/fetch-utils";
import { removeExam } from "../api/hooks";
import ClaimButton from "../components/claim-button";
import IconButton from "../components/icon-button";
import LoadingOverlay from "../components/loading-overlay";
import useRemoveConfirm from "../hooks/useRemoveConfirm";
import { CategoryExam, CategoryPaymentExam } from "../interfaces";
import useTitle from "../hooks/useTitle";
import { IconTrash } from "@tabler/icons-react";

const loadExams = async (includeHidden: boolean) => {
  return (
    await fetchGet(
      `/api/exam/listimportexams/${includeHidden ? "?includehidden=true" : ""}`,
    )
  ).value as CategoryExam[];
};
const loadPaymentExams = async () => {
  return (await fetchGet("/api/exam/listpaymentcheckexams/"))
    .value as CategoryPaymentExam[];
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
  const [removeConfirm, modals] = useRemoveConfirm();
  const { run: runRemoveExam } = useRequest(removeExam, {
    manual: true,
    onSuccess: reloadExams,
  });
  const handleRemoveClick = (exam: CategoryExam) => {
    removeConfirm(
      `Remove the exam named ${exam.displayname}? This will remove all answers and can not be undone!`,
      () => runRemoveExam(exam.filename),
    );
  };
  const {
    error: payError,
    loading: payLoading,
    data: paymentExams,
  } = useRequest(loadPaymentExams);

  const error = examsError ?? payError;

  return (
    <Container size="xl">
      {modals}
      {paymentExams && paymentExams.length > 0 && (
        <div>
          <Title my="sm" order={2}>
            Transcripts
          </Title>
          <div>
            <LoadingOverlay visible={payLoading} />
            <Table striped>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Name</th>
                  <th>Uploader</th>
                </tr>
              </thead>
              <tbody>
                {paymentExams.map(exam => (
                  <tr key={exam.filename}>
                    <Table.Td>{exam.category_displayname}</Table.Td>
                    <Table.Td>
                      <Link to={`/exams/${exam.filename}`} target="_blank">
                        {exam.displayname}
                      </Link>
                    </Table.Td>
                    <Table.Td>
                      <Link to={`/user/${exam.payment_uploader}`}>
                        {exam.payment_uploader_displayname}
                      </Link>
                    </Table.Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>
      )}
      <Title my="sm" order={2}>
        Import Queue
      </Title>
      {error && <div>{error.message}</div>}
      <div>
        <LoadingOverlay visible={examsLoading} />
        <Table fz="md">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Category</Table.Th>
              <Table.Th>Name</Table.Th>
              <Table.Th>Import State</Table.Th>
              <Table.Th>Claim</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {exams?.map((exam: CategoryExam) => (
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
                  {!exam.finished_cuts && (
                    <ClaimButton exam={exam} reloadExams={reloadExams} />
                  )}
                </Table.Td>
                <Table.Td>
                  <IconButton
                    size="md"
                    color="red"
                    tooltip="Delete exam"
                    icon={<IconTrash />}
                    variant="outline"
                    onClick={() => handleRemoveClick(exam)}
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
    </Container>
  );
};
export default ModQueue;
