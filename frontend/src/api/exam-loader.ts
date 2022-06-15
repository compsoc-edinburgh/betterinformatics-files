import {
  AnswerSection,
  PdfSection,
  Section,
  SectionKind,
  ServerCutPosition,
} from "../interfaces";
import { fetchGet } from "./fetch-utils";

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
          allow_new_legacy_answer: false,
          hidden: true,
          has_answers,
          cutHidden: hidden,
          cutVersion,
          name: cut.name,
        });
      }
    }
    if (lastpos < 1) {
      const key = `${akey}-${lastpos}-${1}`;
      sections.push(createPdfSection(key, undefined, i, lastpos, 1, false));
      akey++;
    }
  }
  return sections;
}

export async function loadAnswerSection(oid: string): Promise<AnswerSection> {
  try {
    const section = await fetchGet(`/api/exam/answersection/${oid}/`);
    const answersection = section.value;
    answersection.key = oid;
    answersection.kind = SectionKind.Answer;
    return answersection;
  } catch (e) {
    return Promise.reject(e);
  }
}
