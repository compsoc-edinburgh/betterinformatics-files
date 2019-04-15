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
  askerDisplayName: string; // display name of asker
  allow_new_answer: boolean; // whether the current user can add an answer
  allow_new_legacy_answer: boolean; // whether a legacy answer can be posted
  hidden: boolean; // whether the element is currently hidden
  cutVersion: number; // version of the answer section, should reload if changed
}

export interface Answer {
  oid: string; // unique id within answers
  upvotes: string[]; // usernames of people who upvoted
  authorId: string; // username
  authorDisplayName: string; // display name of author
  canEdit: boolean; // whether the current user can edit the answer
  isUpvoted: boolean; // whether the current user upvoted the answer
  isDownvoted: boolean; // whether the current user downvoted the answer
  comments: Comment[];
  text: string;
  time: string; // ISO 8601, creation time
  divRef: HTMLDivElement; // root div element for scroll jumping
}

export interface Comment {
  oid: string; // unique id within comments
  text: string;
  authorId: string; // username
  authorDisplayName: string; // display name of author
  canEdit: boolean; // whether the current user can edit the comment
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
  cutVersion: number;
}

export interface CategoryExam {
  displayname: string; // Name of exam which should be displayed
  filename: string; // unique filename
  category: string; // category of exam
  examtype: string; // type of exam
  remark: string; // remark for the exam
  import_claim: string; // the user who is importing the exam
  import_claim_displayname: string; // the name of the user who claimed the exam
  import_claim_time: string; // time at which the user claimed the exam
  public: boolean; // whether the exam is public
  finished_cuts: boolean; // whether all cuts were added
  finished_wiki_transfer: boolean; // whether all old solutions were added
  canView: boolean; // whether the exam can be viewed by the user
}

export interface CategoryPaymentExam {
  displayname: string;
  filename: string;
  category: string;
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
    categories: CategoryMetaData[];
  }[];
}

export interface CategoryMetaData {
  category: string; // Name of category
  slug: string;
  admins: string[];
  semester: string;
  form: string;
  permission: string;
  remark: string;
  has_payments: boolean;
  catadmin: boolean;
}

export interface ExamMetaData {
  canEdit: boolean;
  canView: boolean;
  hasPayed: boolean;
  filename: string;
  displayname: string;
  category: string;
  examtype: string;
  legacy_solution: string;
  master_solution: string;
  resolve_alias: string;
  remark: string;
  public: boolean;
  finished_cuts: boolean;
  finished_wiki_transfer: boolean;
  payment_category: string;
  has_printonly: boolean;
  has_solution: boolean;
  is_payment_exam: boolean;
  payment_exam_checked: boolean;
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
}

export interface PaymentInfo {
  oid: string;
  active: boolean;
  category: string;
  payment_time: string;
  uploaded_filename: string;
  check_time: string;
  refund_time: string;
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