import { useRequest } from "@umijs/hooks";
import { Badge, Button, Container, Table } from "@vseth/components";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { fetchapi, fetchpost } from "../api/fetch-utils";
import { useUser } from "../auth";
import LoadingOverlay from "../components/loading-overlay";
import { hasValidClaim } from "../exam-utils";
import { CategoryExam, CategoryPaymentExam } from "../interfaces";

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
    await fetchapi(
      `/api/exam/listimportexams/${includeHidden ? "?includehidden=true" : ""}`,
    )
  ).value as CategoryExam[];
};
const loadPaymentExams = async () => {
  return (await fetchapi("/api/exam/listpaymentcheckexams/"))
    .value as CategoryPaymentExam[];
};
const loadFlagged = async () => {
  return (await fetchapi("/api/exam/listflagged/")).value as string[];
};
const setClaim = async (filename: string, claim: boolean) => {
  await fetchpost(`/api/exam/claimexam/${filename}/`, {
    claim: claim,
  });
};

const ModQueue: React.FC = () => {
  const { username } = useUser()!;
  const [includeHidden, setIncludeHidden] = useState(false);
  const {
    error: examsError,
    loading: examsLoading,
    data: exams,
    run: reloadExams,
  } = useRequest(() => loadExams(includeHidden), {
    refreshDeps: [includeHidden],
  });
  const {
    error: flaggedError,
    loading: flaggedLoading,
    data: flaggedAnswers,
  } = useRequest(loadFlagged);
  const {
    error: payError,
    loading: payLoading,
    data: paymentExams,
  } = useRequest(loadPaymentExams);
  const { run: runSetClaim, fetches: setClaimFetches } = useRequest(setClaim, {
    manual: true,
    fetchKey: id => id,
    onSuccess: reloadExams,
  });
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
          <div style={{ position: "relative" }}>
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
                      <Link to={"/exams/" + exam.filename} target="_blank">
                        {exam.displayname}
                      </Link>
                    </td>
                    <td>
                      <Link to={"/user/" + exam.payment_uploader}>
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
      <div style={{ position: "relative" }}>
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
              exams.map(exam => (
                <tr key={exam.filename}>
                  <td>{exam.category_displayname}</td>
                  <td>
                    <Link to={`/exams/${exam.filename}`} target="_blank">
                      {exam.displayname}
                    </Link>
                    <div>
                      {exam.public ? (
                        <Badge color="primary">public</Badge>
                      ) : (
                        <Badge color="primary">hidden</Badge>
                      )}
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
                    {!exam.finished_cuts || !exam.finished_wiki_transfer ? (
                      hasValidClaim(exam) ? (
                        exam.import_claim === username ? (
                          <Button
                            onClick={() => runSetClaim(exam.filename, false)}
                          >
                            Release Claim
                          </Button>
                        ) : (
                          <span>
                            Claimed by {exam.import_claim_displayname}
                          </span>
                        )
                      ) : (
                        <Button
                          onClick={() => runSetClaim(exam.filename, true)}
                        >
                          Claim Exam
                        </Button>
                      )
                    ) : (
                      <span>-</span>
                    )}
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
