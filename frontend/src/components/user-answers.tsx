import { useUserAnswers } from "../api/hooks";
import React from "react";
import { Alert, Spinner } from "@vseth/components";
import AnswerComponent from "./answer";

interface UserAnswersProps {
  username: string;
}
const UserAnswers: React.FC<UserAnswersProps> = ({ username }) => {
  const [error, loading, answers, reload] = useUserAnswers(username);
  return (
    <>
      <h2>Answers</h2>
      {error && <Alert color="danger">{error.message}</Alert>}
      {loading && <Spinner />}
      {answers &&
        answers.map(answer => (
          <AnswerComponent
            key={answer.oid}
            answer={answer}
            isLegacyAnswer={answer.isLegacyAnswer}
            onSectionChanged={reload}
          />
        ))}
    </>
  );
};
export default UserAnswers;
