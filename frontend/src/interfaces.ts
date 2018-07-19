export type Section = AnswerSection | PdfSection;

export enum SectionKind {
  Answer,
  Pdf,
}

export interface AnswerSection {
  key: React.Key;
  kind: SectionKind.Answer;
  answers: Answer[];
  removed: boolean; // whether this section has been logically "removed"
  asker: string; // username of person who created section
  oid: string; //TODO some unique ID?
}

export interface Answer {
  upvotes: string[]; // usernames of people who upvoted
  authorId: string; // username
  comments: Comment[];
  text: string;
  time: string; // ISO 8601 // TODO probably creation time?
  oid: string; // TODO some unique ID?
}

export interface Comment {
  text: string;
  authorId: string; // username
  time: string; // ISO 8601 // TODO probably creation time?
  oid: string; // TODO some unique ID?
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
