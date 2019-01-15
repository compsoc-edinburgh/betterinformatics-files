import {Section, AnswerSection, SectionKind, PdfSection, ServerCutPosition} from "./interfaces";

function createPdfSection(key: number, page: number, start: number, end: number): PdfSection {
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
  const response = await fetch(`/api/exam/${filename}/cuts`);
  const responseJson = await response.json();
  const cuts = responseJson.value;
  let akey = -1;
  let sections: Section[] = [];
  for (let i = 1; i <= pageCount; i++) {
    let lastpos = 0;
    if (i in cuts) {
      cuts[i].forEach((cut: ServerCutPosition) => {
        const {relHeight: position, oid} = cut;
        if (position !== lastpos) {
          sections.push(createPdfSection(akey, i, lastpos, position));
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
        });
      });
    }
    if (lastpos < 1) {
      sections.push(createPdfSection(akey, i, lastpos, 1));
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
    const section = await (await fetch(`/api/exam/${filename}/answersection/${oid}`)).json();
    let answersection = section.value.answersection;
    answersection.key = oid;
    answersection.kind = SectionKind.Answer;
    return answersection;
  } catch (e) {
    return Promise.reject(e);
  }
}
