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
  divRef?: HTMLDivElement; // root div element for scroll jumping
  isAnonymous?: boolean; // whether the answer is posted anonymously
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
  examtype: string; // type of exam
  remark: string; // remark for the exam
  import_claim: string | null; // the user who is importing the exam
  import_claim_displayname: string | null; // the name of the user who claimed the exam
  import_claim_time: string | null; // time at which the user claimed the exam
  public: boolean; // whether the exam is public
  has_solution: boolean; // whether there is an official solution
  finished_cuts: boolean; // whether all cuts were added
  canView: boolean; // whether the exam can be viewed by the user
  count_cuts: number; // number of cuts in exam
  count_answered: number; // number of cuts with answers in exam
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
  documentcount: number;
  answerprogress: number;
}

export interface CategoryMetaData {
  displayname: string; // Name of category
  slug: string;
  admins: string[];
  experts: string[];
  semester: string;
  form: string;
  euclid_codes: string[];
  permission: string;
  remark: string;
  catadmin: boolean;
  more_exams_link: string;
  more_markdown_link: string;
  examcountpublic: number;
  examcountanswered: number;
  documentcount: number;
  answerprogress: number;
  attachments: Attachment[];
  favourite: boolean;
}

export type CategoryMetaDataAny =
  | CategoryMetaData
  | CategoryMetaDataOverview
  | CategoryMetaDataMinimal;

export interface ExamMetaData {
  canEdit: boolean;
  isExpert: boolean;
  canView: boolean;
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
  has_solution: boolean;
  count_cuts: number;
  count_answered: number;
  attachments: Attachment[];

  exam_file?: string;
  solution_file?: string;
}

export interface ExamSelectedForDownload {
  filename: string;
  displayname: string;
}

export interface NotificationEnabled {
  type: number;
  enabled: boolean;
  email_enabled: boolean;
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
  score_documents: number;
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
  anonymised: boolean;
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

export interface Stats {
  user_stats: GranularityStats<UserStat>;
  exam_stats: GranularityStats<ExamStat>;
  document_stats: GranularityStats<DocumentStat>;
}

// Mapping from granularity to list of data points for that granularity
export interface GranularityStats<T> {
  [key: string]: T[];
}

export interface UserStat {
  date: string;
  count: number;
}

export interface ExamStat {
  date: string;
  answered_count: number;
  answers_count: number;
}

export interface DocumentStat {
  date: string;
  count: number;
}

export interface BICourseList {
  last_update: string;
  list: BICourseDict;
}

export interface BICourseDict {
  [key: string]: BICourse;
}

export interface BICourse {
  acronym: string;
  course_url: string;
  credits: number;
  cw_exam_ratio: number[];
  delivery: string;
  delivery_ordinal: number;
  diet: string;
  euclid_code: string;
  euclid_url: string;
  euclid_code_shadow: string | undefined;
  euclid_url_shadow: string | undefined;
  level: number;
  name: string;
  year: string;
}
