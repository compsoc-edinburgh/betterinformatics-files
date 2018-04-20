import * as React from "react";
import { SectionRenderer } from "./split-render";
import { Section, SectionKind } from "./interfaces";
import PdfSection from "./pdf-section";
import AnswerSection from "./answer-section";

interface Props {
  renderer: SectionRenderer;
  sections: Section[];
  width: number;
}

export default ({ renderer, sections, width }: Props) => (
  <div>
    {sections.map(e => {
      switch (e.kind) {
        case SectionKind.Answer:
          return <AnswerSection key={e.key} section={e} width={width} />;
        case SectionKind.Pdf:
          return (
            <PdfSection
              key={e.key}
              section={e}
              renderer={renderer}
              width={width}
            />
          );
        default:
          return null as never;
      }
    })}
  </div>
);
