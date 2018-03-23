import * as React from "react";
import { DocumentRenderer } from "./split-render";
import { Section, SectionKind } from "./interfaces";
import PdfSection from "./pdf-section";
import AnswerSection from "./answer-section";

interface Props {
  renderer: DocumentRenderer;
  sections: Section[];
}

export default ({ renderer, sections }: Props) => (
  <div>
    {sections.map(e => {
      switch (e.kind) {
        case SectionKind.Answer:
          return <AnswerSection section={e} />;
        case SectionKind.Pdf:
          return <PdfSection section={e} renderer={renderer} />;
        default:
          return null as never;
      }
    })}
  </div>
);
