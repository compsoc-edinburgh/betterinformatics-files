import {
  PdfSection,
  Section,
  SectionKind,
  ServerCutPosition,
} from "../interfaces";

function createPdfSection(
  key: string,
  cutOid: string | undefined,
  page: number,
  start: number,
  end: number,
  hidden: boolean,
): PdfSection {
  return {
    key,
    cutOid,
    kind: SectionKind.Pdf,
    start: {
      page,
      position: start,
    },
    end: {
      page,
      position: end,
    },
    hidden,
  };
}
type ServerCutResponse = Record<string, ServerCutPosition[]>;

export function loadSections(
  pageCount: number,
  cuts: ServerCutResponse,
): Section[] {
  let akey = -1;
  const sections: Section[] = [];
  for (let i = 1; i <= pageCount; i++) {
    let lastpos = 0;
    if (i in cuts) {
      for (const cut of cuts[i]) {
        const {
          relHeight: position,
          oid,
          cutVersion,
          hidden,
          has_answers,
        } = cut;
        if (position !== lastpos) {
          const key = `${akey}-${lastpos}-${position}`;
          sections.push(
            createPdfSection(key, oid, i, lastpos, position, hidden),
          );
          akey++;
          lastpos = position;
        }
        sections.push({
          oid,
          kind: SectionKind.Answer,
          answers: [],
          allow_new_answer: true,
          allow_new_official_answer: false,
          hidden: true,
          has_answers,
          cutHidden: hidden,
          cutVersion,
          name: cut.name,
        });
      }
    }
    // Create a 'fake' PDF section for the remaining part of the page from
    // lastPos to 1.0. If there were no sections on this page at all, this will
    // represent the full page. Otherwise, it'll be the part after the last cut.
    if (lastpos < 1) {
      const key = `${akey}-${lastpos}-1`;
      sections.push(createPdfSection(key, undefined, i, lastpos, 1, false));
      akey++;
    }
  }
  return sections;
}
