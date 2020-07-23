import { useUserAnswers } from "../api/hooks";
import React from "react";
import { Alert, Spinner, CardColumns } from "@vseth/components";
import AnswerComponent from "./answer";
import { css } from "emotion";
const columnStyle = css`
  column-gap: 0;
  grid-column-gap: 0;
  margin: 0 -0.75em;
  padding-top: 1em;
  padding-bottom: 1em;
  column-count: 1;
  @media (min-width: 800px) {
    column-count: 2;
  }
`;
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
      <CardColumns className={columnStyle}>
        {answers &&
          answers.map(answer => (
            <div className="px-2" key={answer.oid}>
              <AnswerComponent
                hasId={false}
                answer={answer}
                isLegacyAnswer={answer.isLegacyAnswer}
                onSectionChanged={reload}
              />
            </div>
          ))}
      </CardColumns>
    </>
  );
};
export default UserAnswers;
