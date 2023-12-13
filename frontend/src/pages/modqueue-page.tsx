import { useRequest } from "@umijs/hooks";
import { Anchor, Badge, Button, Container, Table, Title } from "@mantine/core";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { fetchGet } from "../api/fetch-utils";
import ClaimButton from "../components/claim-button";
import LoadingOverlay from "../components/loading-overlay";
import { CategoryExam, CategoryPaymentExam } from "../interfaces";
import useTitle from "../hooks/useTitle";

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
  const {
    error: payError,
    loading: payLoading,
    data: paymentExams,
  } = useRequest(loadPaymentExams);

  const error = examsError || flaggedError || payError;

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
      {paymentExams && paymentExams.length > 0 && (
        <div>
          <Title my="sm" order={2}>
            Transcripts
          </Title>
          <div>
            <LoadingOverlay loading={payLoading} />
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
                    <td>{exam.category_displayname}</td>
                    <td>
                      <Link to={`/exams/${exam.filename}`} target="_blank">
                        {exam.displayname}
                      </Link>
                    </td>
                    <td>
                      <Link to={`/user/${exam.payment_uploader}`}>
                        {exam.payment_uploader_displayname}
                      </Link>
                    </td>
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
        <LoadingOverlay loading={examsLoading} />
        <Table striped fontSize="md">
          <thead>
            <tr>
              <th>Category</th>
              <th>Name</th>
              <th>Import State</th>
              <th>Claim</th>
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
                  <td>
                    {exam.finished_cuts
                      ? exam.finished_wiki_transfer
                        ? "All done"
                        : "Needs Wiki Import"
                      : "Needs Cuts"}
                  </td>
                  <td>
                    <ClaimButton exam={exam} reloadExams={reloadExams} />
                  </td>
                </tr>
              ))}
          </tbody>
        </Table>
      </div>
      <Button mt="sm" mb="xl" onClick={() => setIncludeHidden(!includeHidden)}>
        {includeHidden ? "Hide" : "Show"} Complete Hidden Exams
      </Button>
    </Container>
  );
};
export default ModQueue;
