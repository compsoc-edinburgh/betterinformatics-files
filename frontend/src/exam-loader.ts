import { Section, AnswerSection, SectionKind, PdfSection, ServerCutPosition } from "./interfaces";

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
  for (let i = 0; i < pageCount; i++) {
    let lastpos = 0;
    if (i in cuts) {
      cuts[i].foreach((cut: ServerCutPosition) => {
        const { relHeight: position, oid } = cut
        if (position !== lastpos) {
          sections.push(createPdfSection(akey, i+1, lastpos, position));
          akey++;
          lastpos = position;
        }
        sections.push({
          oid: oid,
          kind: SectionKind.Answer,
          answers: [],
          removed: false,
          asker: ""
        });
      });
    }
    if (lastpos < 1) {
      sections.push(createPdfSection(akey, i+1, lastpos, 1));
      akey++;
    }
  }
  return sections;
}

export async function loadAnswerSection(
  filename: string,
  oid: string
): Promise<AnswerSection> {
  let section = await fetch(`/api/exam/${filename}/answersection/${oid}`)
    .then((res) => res.json());
  section.answersection.key =  oid;
  section.answersection.kind = SectionKind.Answer;
  section.answersection.oid = oid;
  section.answersection.removed = false;
  return section.answersection;
}
