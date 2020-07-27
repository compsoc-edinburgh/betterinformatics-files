import { useUserAnswers } from "../api/hooks";
import React from "react";
import { Alert, Spinner, CardColumns } from "@vseth/components";
import AnswerComponent from "./answer";
import { css } from "emotion";
// `transform: translateX(0)` fixes an issue on webkit browser
// where relative positioned elements aren't displayed in containers
// with multiple columns. This is a quick-fix as pointed out on the
// webkit bug reporting platform.
// Example: https://codepen.io/lukasmoeller/pen/JjGyJXY (rel is hidden)
// Issue: https://gitlab.ethz.ch/vis/cat/community-solutions/-/issues/147
// Webkit Bug: https://bugs.webkit.org/show_bug.cgi?id=209681
// It seems like there is a fix live in Safari Technology Preview
// This fix should be left in here until the fix is published for
// Safari iOS + macOS
const columnStyle = css`
  transform: translateX(0);
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
