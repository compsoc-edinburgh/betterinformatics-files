import * as React from "react";
import { DocumentRenderer } from "./split-render";
import { Section, SectionKind } from "./interfaces";
import Exam from "./exam";

const SECTIONS: Section[] = [
  {
    kind: SectionKind.Answer,
  },
  {
    kind: SectionKind.Pdf,
    start: {
      page: 1,
      position: 0.2,
    },
    end: {
      page: 1,
      position: 0.5,
    },
  },
];
const RENDERER = new DocumentRenderer();

interface State {
  renderer?: DocumentRenderer;
}

export default class App extends React.Component<{}, State> {
  state: State = {};

  render() {
    return <Exam sections={SECTIONS} renderer={RENDERER} />;
  }
}
