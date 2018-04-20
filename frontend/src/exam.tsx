import * as React from "react";
import { SectionRenderer } from "./split-render";
import { Section, SectionKind } from "./interfaces";
import PdfSection from "./pdf-section";
import AnswerSection from "./answer-section";

interface Props {
  renderer: SectionRenderer;
  sections: Section[];
  width: number;
  dpr: number; // Device Pixel Ratio
}

export default ({ renderer, sections, width, dpr }: Props) => (
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
              dpr={dpr}
            />
          );
        default:
          return null as never;
      }
    })}
  </div>
);
