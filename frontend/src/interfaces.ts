export type Section = AnswerSection | PdfSection;

export enum SectionKind {
  Answer,
  Pdf,
}

export interface AnswerSection {
  key: React.Key;
  kind: SectionKind.Answer;
}

export interface PdfSection {
  key: React.Key;
  kind: SectionKind.Pdf;
  start: CutPosition;
  end: CutPosition;
}

export interface CutPosition {
  page: number; // the first page is 1
  position: number;
}
