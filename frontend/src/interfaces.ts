export type Section = AnswerSection | PdfSection;

export enum SectionKind {
  Answer,
  Pdf,
}

export interface AnswerSection {
  oid: string; // unique id within answer sections
  kind: SectionKind.Answer;
  answers: Answer[];
  asker: string; // username of person who created section
  allow_new_answer: boolean;
}

export interface Answer {
  oid: string; // unique id within answers
  upvotes: string[]; // usernames of people who upvoted
  authorId: string; // username
  comments: Comment[];
  text: string;
  time: string; // ISO 8601, creation time
}

export interface Comment {
  oid: string; // unique id within comments
  text: string;
  authorId: string; // username
  time: string; // ISO 8601, creation time
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

export interface ServerCutPosition {
  relHeight: number;
  oid: string;
}
