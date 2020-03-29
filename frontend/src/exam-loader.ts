import { Section, AnswerSection, SectionKind, PdfSection } from "./interfaces";
import { fetchapi } from "./fetch-utils";

function createPdfSection(
  key: string,
  cutOid: string | undefined,
  page: number,
  start: number,
  end: number,
  hidden: boolean,
): PdfSection {
  return {
    key: key,
    cutOid,
    kind: SectionKind.Pdf,
    start: {
      page: page,
      position: start,
    },
    end: {
      page: page,
      position: end,
    },
    hidden,
  };
}

export async function loadSections(
  filename: string,
  pageCount: number,
): Promise<Section[]> {
  const response = await fetchapi(`/api/exam/cuts/${filename}/`);
  const cuts = response.value;
  let akey = -1;
  const sections: Section[] = [];
  for (let i = 1; i <= pageCount; i++) {
    let lastpos = 0;
    if (i in cuts) {
      for (const cut of cuts[i]) {
        const { relHeight: position, oid, cutVersion, hidden } = cut;
        if (position !== lastpos) {
          const key = akey + "-" + lastpos + "-" + position;
          sections.push(
            createPdfSection(key, oid, i, lastpos, position, hidden),
          );
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
          cutHidden: hidden,
          cutVersion: cutVersion,
          name: cut.name,
        });
      }
    }
    if (lastpos < 1) {
      const key = akey + "-" + lastpos + "-" + 1;
      sections.push(createPdfSection(key, undefined, i, lastpos, 1, false));
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
