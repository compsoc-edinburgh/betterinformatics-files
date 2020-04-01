import {
  Section,
  AnswerSection,
  SectionKind,
  PdfSection,
  ServerCutPosition,
} from "../interfaces";
import { fetchapi } from "./fetch-utils";

function createPdfSection(
  key: string,
  page: number,
  start: number,
  end: number,
): PdfSection {
  return {
    key: key,
    kind: SectionKind.Pdf,
    start: {
      page: page,
      position: start,
    },
    end: {
      page: page,
      position: end,
    },
  };
}
interface ServerCutResponse {
  [pageNumber: string]: ServerCutPosition[];
}

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
        const { relHeight: position, oid, cutVersion } = cut;
        if (position !== lastpos) {
          const key = akey + "-" + lastpos + "-" + position;
          sections.push(createPdfSection(key, i, lastpos, position));
          akey++;
          lastpos = position;
        }
        sections.push({
          oid: oid,
          kind: SectionKind.Answer,
          answers: [],
          allow_new_answer: true,
          allow_new_legacy_answer: false,
          hidden: true,
          cutVersion: cutVersion,
          name: cut.name,
        });
      }
    }
    if (lastpos < 1) {
      const key = akey + "-" + lastpos + "-" + 1;
      sections.push(createPdfSection(key, i, lastpos, 1));
      akey++;
    }
  }
  return sections;
}

export async function loadAnswerSection(oid: string): Promise<AnswerSection> {
  try {
    const section = await fetchapi(`/api/exam/answersection/${oid}/`);
    const answersection = section.value;
    answersection.key = oid;
    answersection.kind = SectionKind.Answer;
    return answersection;
  } catch (e) {
    return Promise.reject(e);
  }
}
