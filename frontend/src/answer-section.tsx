import * as React from "react";
import { AnswerSection } from "./interfaces";
import { css } from "glamor";
import Answer from "./answer";

interface Props {
  section: AnswerSection;
  width: number;
}

const styles = {
  wrapper: css({
    border: "1px solid green",
  }),
};

export default ({ section }: Props) => (
  <div {...styles.wrapper}>
    <div>
      <b>Answer section</b>
    </div>
    <div>Removed: {section.removed.toString()}</div>
    <button>Remove</button>
    <div>Marked by {section.asker}</div>
    <div>{section.answers.map(e => <Answer key={e.oid} answer={e} />)}</div>
    <button>Add Answer</button>
  </div>
);
