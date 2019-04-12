import {Section, AnswerSection, SectionKind, PdfSection, ServerCutPosition} from "./interfaces";
import {fetchapi} from "./fetch-utils";

function createPdfSection(key: string, page: number, start: number, end: number): PdfSection {
  return {
    key: key,
    kind: SectionKind.Pdf,
    start: {
      page: page,
      position: start
    },
    end: {
      page: page,
      position: end
    }
  };
}

export async function loadSections(
  filename: string,
  pageCount: number
): Promise<Section[]> {
  const response = await fetchapi(`/api/exam/${filename}/cuts`);
  const cuts = response.value;
  let akey = -1;
  let sections: Section[] = [];
  for (let i = 1; i <= pageCount; i++) {
    let lastpos = 0;
    if (i in cuts) {
      cuts[i].forEach((cut: ServerCutPosition) => {
        const {relHeight: position, oid, cutVersion} = cut;
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
          asker: "",
          askerDisplayName: "",
          allow_new_answer: true,
          allow_new_legacy_answer: false,
          hidden: true,
          cutVersion: cutVersion,
        });
      });
    }
    if (lastpos < 1) {
      const key = akey + "-" + lastpos + "-" + 1;
      sections.push(createPdfSection(key, i, lastpos, 1));
      akey++;
    }
  }
  return sections;
}

export async function loadAnswerSection(
  filename: string,
  oid: string
): Promise<AnswerSection> {
  try {
    const section = await fetchapi(`/api/exam/${filename}/answersection/${oid}`);
    let answersection = section.value.answersection;
    answersection.key = oid;
    answersection.kind = SectionKind.Answer;
    return answersection;
  } catch (e) {
    return Promise.reject(e);
  }
}
