import { useRequest } from "@umijs/hooks";
import { Badge, Button, Container, Table } from "@vseth/components";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { fetchGet } from "../api/fetch-utils";
import ClaimButton from "../components/claim-button";
import LoadingOverlay from "../components/loading-overlay";
import { CategoryExam, CategoryPaymentExam } from "../interfaces";
import useTitle from "../hooks/useTitle";

interface Props {
  username: string;
  isAdmin: boolean;
}

interface State {
  exams: CategoryExam[];
  paymentExams: CategoryPaymentExam[];
  flaggedAnswers: string[];
  includeHidden: boolean;
  error?: string;
}

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
    <Container>
      {flaggedAnswers && flaggedAnswers.length > 0 && (
        <div>
          <h2>Flagged Answers</h2>
          {flaggedAnswers.map(answer => (
            <div>
              <a href={answer} target="_blank" rel="noopener noreferrer">
                {answer}
              </a>
            </div>
          ))}
        </div>
      )}
      {paymentExams && paymentExams.length > 0 && (
        <div>
          <h2>Transcripts</h2>
          <div className="position-relative">
            <LoadingOverlay loading={payLoading} />
            <Table>
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
      <h2>Import Queue</h2>
      {error && <div>{error}</div>}
      <div className="position-relative">
        <LoadingOverlay loading={examsLoading} />
        <Table>
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
                    <Link to={`/exams/${exam.filename}`} target="_blank">
                      {exam.displayname}
                    </Link>
                    <div>
                      <Badge color="primary">
                        {exam.public ? "public" : "hidden"}
                      </Badge>
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
      <div>
        <Button onClick={() => setIncludeHidden(!includeHidden)}>
          {includeHidden ? "Hide" : "Show"} Complete Hidden Exams
        </Button>
      </div>
    </Container>
  );
};
export default ModQueue;
