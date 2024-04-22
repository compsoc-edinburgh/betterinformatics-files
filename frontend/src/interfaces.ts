export type Section = AnswerSection | PdfSection;

export enum SectionKind {
  Answer,
  Pdf,
}

export interface AnswerSection {
  oid: string; // unique id within answer sections
  kind: SectionKind.Answer;
  answers: Answer[];
  allow_new_answer: boolean; // whether the current user can add an answer
  allow_new_legacy_answer: boolean; // whether a legacy answer can be posted
  cutHidden: boolean;
  has_answers: boolean;
  hidden: boolean; // whether the element is currently hidden
  cutVersion: number; // version of the answer section, should reload if changed
  name: string;
}

export interface Answer {
  oid: string; // unique id within answers
  longId: string; // long unique id
  upvotes: number; // number upvotes minus number of downvotes
  expertvotes: number; // number of experts who upvoted
  authorId: string; // username
  authorDisplayName: string; // display name of author
  canEdit: boolean; // whether the current user can edit the answer
  isUpvoted: boolean; // whether the current user upvoted the answer
  isDownvoted: boolean; // whether the current user downvoted the answer
  isExpertVoted: boolean; // whether the current user expert upvoted the answer
  isFlagged: boolean; // whether the current user flagged the answer
  flagged: number; // number of flaggings
  comments: Comment[];
  text: string;
  time: string; // ISO 8601, creation time
  edittime: string; // ISO 8601, last edit time
  filename: string; // filename of the corresponding exam
  sectionId: string; // id of section containing answer
  isLegacyAnswer: boolean; // whether this is a legacy answer
  divRef?: HTMLDivElement; // root div element for scroll jumping
}

export interface Comment {
  oid: string; // unique id within comments
  longId: string; // long unique id
  text: string;
  authorId: string; // username
  authorDisplayName: string; // display name of author
  canEdit: boolean; // whether the current user can edit the comment
  time: string; // ISO 8601, creation time
  edittime: string; // ISO 8601, last edit time
}

export interface SingleComment {
  oid: string; // unique id within comments
  longId: string; // long unique id
  text: string;
  authorId: string; // username
  answerId: string;
  authorDisplayName: string; // display name of author
  time: string; // ISO 8601, creation time
  edittime: string; // ISO 8601, last edit time

  exam_displayname: string;
  filename: string;

  category_displayname: string;
  category_slug: string;
}

export interface PdfSection {
  key: string | number;
  cutOid?: string;
  kind: SectionKind.Pdf;
  start: CutPosition;
  end: CutPosition;
  hidden: boolean;
}

export interface CutUpdate {
  filename: string;
  pageNum: number;
  relHeight: number;
  name: string;
  hidden: boolean;
  has_answers: boolean;
}

export interface CutPosition {
  page: number; // the first page is 1
  position: number;
}

export interface ServerCutPosition {
  relHeight: number;
  oid: string;
  cutVersion: number;
  name: string;
  hidden: boolean;
  has_answers: boolean;
}

export interface Attachment {
  displayname: string;
  filename: string;
}

export interface CategoryExam {
  displayname: string; // Name of exam which should be displayed
  filename: string; // unique filename
  category_displayname: string; // category of exam
  needs_payment: boolean; // whether a payment is required
  examtype: string; // type of exam
  remark: string; // remark for the exam
  import_claim: string | null; // the user who is importing the exam
  import_claim_displayname: string | null; // the name of the user who claimed the exam
  import_claim_time: string | null; // time at which the user claimed the exam
  public: boolean; // whether the exam is public
  has_solution: boolean; // whether there is an official solution
  is_printonly: boolean; // whether this exam can only be printed
  finished_cuts: boolean; // whether all cuts were added
  canView: boolean; // whether the exam can be viewed by the user
  count_cuts: number; // number of cuts in exam
  count_answered: number; // number of cuts with answers in exam
}

export interface CategoryPaymentExam {
  displayname: string;
  filename: string;
  category_displayname: string;
  payment_uploader: string;
  payment_uploader_displayname: string;
}

export interface MetaCategory {
  displayname: string;
  meta2: {
    displayname: string;
    categories: string[];
  }[];
}

export interface MetaCategoryWithCategories {
  displayname: string;
  meta2: {
    displayname: string;
    categories: CategoryMetaDataOverview[];
  }[];
}

export interface CategoryMetaDataMinimal {
  displayname: string; // Name of category
  slug: string;
}

export interface CategoryMetaDataOverview {
  displayname: string; // Name of category
  slug: string;
  examcountpublic: number;
  examcountanswered: number;
  answerprogress: number;
}

export interface CategoryMetaData {
  displayname: string; // Name of category
  slug: string;
  admins: string[];
  experts: string[];
  semester: string;
  form: string;
  permission: string;
  remark: string;
  has_payments: boolean;
  catadmin: boolean;
  more_exams_link: string;
  documentcount: number;
  examcountpublic: number;
  examcountanswered: number;
  answerprogress: number;
  attachments: Attachment[];
}

export type CategoryMetaDataAny =
  | CategoryMetaData
  | CategoryMetaDataOverview
  | CategoryMetaDataMinimal;

export interface ExamMetaData {
  canEdit: boolean;
  isExpert: boolean;
  canView: boolean;
  hasPayed: boolean;
  filename: string;
  displayname: string;
  category: string;
  category_displayname: string;
  examtype: string;
  master_solution: string;
  resolve_alias: string;
  remark: string;
  public: boolean;
  finished_cuts: boolean;
  needs_payment: boolean;
  is_printonly: boolean;
  has_solution: boolean;
  solution_printonly: boolean;
  is_oral_transcript: boolean;
  oral_transcript_checked: boolean;
  count_cuts: number;
  count_answered: number;
  attachments: Attachment[];

  exam_file?: string;
  solution_file?: string;
  printonly_file?: string;
}

export interface ExamSelectedForDownload {
  filename: string;
  displayname: string;
}

export interface NotificationInfo {
  oid: string;
  receiver: string;
  type: number;
  time: string;
  sender: string;
  senderDisplayName: string;
  title: string;
  message: string;
  link: string;
  read: boolean;
}

export interface UserInfo {
  username: string;
  displayName: string;
  score: number;
  score_answers: number;
  score_comments: number;
  score_cuts: number;
  score_legacy: number;
  score_documents: number;
}

export interface PaymentInfo {
  oid: string;
  active: boolean;
  payment_time: string;
  uploaded_filename: string | null;
  check_time: string | null;
  refund_time: string | null;
  valid_until: string;
}

export interface FeedbackEntry {
  oid: string;
  text: string;
  authorId: string;
  authorDisplayName: string;
  time: string;
  read: boolean;
  done: boolean;
}

export interface FAQEntry {
  oid: string;
  question: string;
  answer: string;
  order: number;
}

export interface CutVersions {
  [oid: string]: number;
}
export interface ServerCutResponse {
  [pageNumber: string]: ServerCutPosition[];
}

export enum EditMode {
  None,
  Add,
  Move,
}
export type EditState =
  | { mode: EditMode.None }
  | { mode: EditMode.Add; snap: boolean }
  | { mode: EditMode.Move; cut: string; snap: boolean };

// Search endpoint

export type HighlightedMatch = string | HighlightedMatch[];
export type HighlightedMatches = HighlightedMatch[];
export type Page = [number, number, HighlightedMatches];
export interface ExamSearchResult {
  type: "exam";
  rank: number;

  headline: HighlightedMatches;

  pages: Page[];

  displayname: string;
  filename: string;

  category_displayname: string;
  category_slug: string;
}
export interface AnswerSearchResult {
  type: "answer";
  rank: number;

  text: string;
  highlighted_words: string[];
  author_username: string;
  author_displayname: string;
  long_id: string;

  exam_displayname: string;
  filename: string;

  category_displayname: string;
  category_slug: string;
}
export interface CommentSearchResult {
  type: "comment";
  rank: number;

  text: string;
  highlighted_words: string[];
  author_username: string;
  author_displayname: string;
  long_id: string;

  exam_displayname: string;
  filename: string;

  category_displayname: string;
  category_slug: string;
}
export type SearchResult =
  | ExamSearchResult
  | AnswerSearchResult
  | CommentSearchResult;
export type SearchResponse = SearchResult[];

export interface Document {
  slug: string;
  display_name: string;
  description: string;
  category: string;
  document_type: string;
  category_display_name: string;
  author: string;
  author_displayname: string;
  comments: DocumentComment[];
  files: DocumentFile[];
  liked: boolean;
  like_count: number;
  time: string; // ISO 8601, creation time
  edittime: string; // ISO 8601, last edit time

  can_edit: boolean;
  can_delete: boolean;
  api_key?: string;
}

export interface DocumentFile {
  oid: number;
  display_name: string;
  filename: string;
  mime_type: string;
}

export interface DocumentComment extends Omit<Comment, "longId" | "oid"> {
  oid: number;
  documentId: number;
}
