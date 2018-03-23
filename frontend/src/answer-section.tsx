import * as React from "react";
import { AnswerSection } from "./interfaces";

interface Props {
  section: AnswerSection;
}

export default ({ section }: Props) => (
  <div>Answer section: {JSON.stringify(section, null, 2)}</div>
);
