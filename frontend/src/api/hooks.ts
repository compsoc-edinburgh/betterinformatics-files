import { useRequest } from "ahooks";
import { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import {
  Answer,
  AnswerSection,
  CategoryExam,
  CategoryMetaData,
  CategoryMetaDataMinimal,
  CutVersions,
  ExamMetaData,
  MetaCategory,
  NotificationInfo,
  PaymentInfo,
  ServerCutResponse,
  SingleComment,
  UserInfo,
  SearchResponse,
  AnswerKind,
} from "../interfaces";
import PDF from "../pdf/pdf-renderer";
import { getDocument } from "../pdf/pdfjs";
import { fetchDelete, fetchGet, fetchPost, fetchPut } from "./fetch-utils";

// Interval to consider "close succession" to de-dupe requests
const RAPID_SUCCESSIVE_REQUESTS_DEDUPE_INTERVAL = 500; // milliseconds

export declare type Mutate<R> = (x: R | undefined | ((data: R) => R)) => void;

const loadUserInfo = async (username: string) => {
  return (await fetchGet(`/api/scoreboard/userinfo/${username}/`))
    .value as UserInfo;
};

export const useUserInfo = (username: string) => {
  const { error, loading, data } = useRequest(() => loadUserInfo(username), {
    refreshDeps: [username],
    cacheKey: `userinfo-${username}`,
  });
  return [error, loading, data] as const;
};
const loadEnabledNotifications = async (isMyself: boolean) => {
  if (isMyself) {
    return new Set<number>(
      (await fetchGet(`/api/notification/getenabled/`)).value,
    );
  } else {
    return undefined;
  }
};
export const useEnabledNotifications = (isMyself: boolean) => {
  const { error, loading, data, run } = useRequest(
    () => loadEnabledNotifications(isMyself),
    {
      refreshDeps: [isMyself],
      cacheKey: "enabled-notifications",
    },
  );
  return [error, loading, data, run] as const;
};
const setEnabledNotifications = async (type: number, enabled: boolean) => {
  await fetchPost(`/api/notification/setenabled/`, {
    type,
    enabled,
  });
};
export const useSetEnabledNotifications = (cb: () => void) => {
  const { error, loading, run } = useRequest(setEnabledNotifications, {
    manual: true,
    onSuccess: cb,
  });
  return [error, loading, run] as const;
};
const loadPayments = async (username: string, isMyself: boolean) => {
  const query = isMyself
    ? "/api/payment/me/"
    : `/api/payment/query/${username}/`;
  return (await fetchGet(query)).value as PaymentInfo[];
};
export const usePayments = (username: string, isMyself: boolean) => {
  const { error, loading, data, run } = useRequest(
    () => loadPayments(username, isMyself),
    {
      refreshDeps: [username, isMyself],
      cacheKey: `payments-${username}`,
    },
  );
  return [error, loading, data, run] as const;
};
const addPayment = async (username: string) => {
  return (await fetchPost("/api/payment/pay/", { username })).value;
};
export const useAddPayments = (cb: () => void) => {
  const { error, loading, run } = useRequest(addPayment, {
    manual: true,
    onSuccess: cb,
  });
  return [error, loading, run] as const;
};
const removePayment = async (payment: string) => {
  return await fetchPost(`/api/payment/remove/${payment}/`, {});
};
export const useRemovePayment = (cb: () => void) => {
  const { error, loading, run } = useRequest(removePayment, {
    manual: true,
    onSuccess: cb,
  });
  return [error, loading, run] as const;
};
const refundPayment = async (payment: string) => {
  return await fetchPost(`/api/payment/refund/${payment}/`, {});
};
export const useRefundPayment = (cb: () => void) => {
  const { error, loading, run } = useRequest(refundPayment, {
    manual: true,
    onSuccess: cb,
  });
  return [error, loading, run] as const;
};
const loadNotifications = async (mode: "all" | "unread") => {
  if (mode === "all") {
    return (await fetchGet("/api/notification/all/"))
      .value as NotificationInfo[];
  } else {
    return (await fetchGet("/api/notification/unread/"))
      .value as NotificationInfo[];
  }
};
export const useNotifications = (mode: "all" | "unread") => {
  const { error, loading, data, run } = useRequest(
    () => loadNotifications(mode),
    {
      refreshDeps: [mode],
      cacheKey: `notifications-${mode}`,
    },
  );
  return [error, loading, data, run] as const;
};
const markAllRead = async (...ids: string[]) => {
  return Promise.all(
    ids.map(oid =>
      fetchPost(`/api/notification/setread/${oid}/`, {
        read: true,
      }),
    ),
  );
};
export const useMarkAllAsRead = () => {
  const { error, loading, run } = useRequest(markAllRead, {
    manual: true,
  });
  return [error, loading, run] as const;
};
const loadUserAnswers = async (username: string, page: number = -1) => {
  const pageStr = page === -1 ? "" : `${page}/`;
  return (await fetchGet(`/api/exam/listbyuser/${username}/${pageStr}`))
    .value as Answer[];
};
export const useUserAnswers = (username: string, page: number = -1) => {
  const { error, loading, data, run } = useRequest(
    () => loadUserAnswers(username, page),
    {
      refreshDeps: [username, page],
      cacheKey: `page-${page}-user-answers-${username}`,
    },
  );
  return [error, loading, data, run] as const;
};
const loadUserComments = async (username: string, page: number = -1) => {
  const pageStr = page === -1 ? "" : `${page}/`;
  return (await fetchGet(`/api/exam/listcommentsbyuser/${username}/${pageStr}`))
    .value as SingleComment[];
};
export const useUserComments = (username: string, page: number = -1) => {
  const { error, loading, data, run } = useRequest(
    () => loadUserComments(username, page),
    {
      refreshDeps: [username, page],
      cacheKey: `page-${page}-user-comments-${username}`,
    },
  );
  return [error, loading, data, run] as const;
};

export const loadCategories = async () => {
  return (await fetchGet("/api/category/listonlyadmin/"))
    .value as CategoryMetaDataMinimal[];
};
export const loadAllCategories = async () => {
  return (await fetchGet("/api/category/listwithmeta/"))
    .value as CategoryMetaDataMinimal[];
};
export const loadExamTypes = async () => {
  return (await fetchGet("/api/exam/listexamtypes/")).value as string[];
};
export const loadSearch = async (
  term: string,
  category_slug?: string,
  exams_with_category_name?: boolean,
) => {
  return (
    await fetchPost("/api/exam/search/", {
      term,
      category: category_slug,
      exams_with_category_name,
    })
  ).value as SearchResponse;
};
export const uploadPdf = async (
  file: Blob,
  displayname: string,
  category: string,
) => {
  return (
    await fetchPost("/api/exam/upload/exam/", { file, displayname, category })
  ).filename as string;
};
export const uploadTranscript = async (file: Blob, category: string) => {
  return (await fetchPost("/api/exam/upload/transcript/", { file, category }))
    .filename as string;
};
export const loadCategoryMetaData = async (slug: string) => {
  return (await fetchGet(`/api/category/metadata/${slug}/`))
    .value as CategoryMetaData;
};
export const loadMetaCategories = async () => {
  return (await fetchGet("/api/category/listmetacategories/"))
    .value as MetaCategory[];
};
export const useMetaCategories = () => {
  const { error, loading, data, mutate } = useRequest(loadMetaCategories, {
    cacheKey: "listmetacategories",
    staleTime: RAPID_SUCCESSIVE_REQUESTS_DEDUPE_INTERVAL,
  });
  return [error, loading, data, mutate] as const;
};
export const loadList = async (slug: string) => {
  return (await fetchGet(`/api/category/listexams/${slug}/`))
    .value as CategoryExam[];
};
export const claimExam = async (filename: string, claim: boolean) => {
  await fetchPost(`/api/exam/claimexam/${filename}/`, {
    claim,
  });
};
export const loadExamAdminStatus = async (filename: string) => {
  return (await fetchGet(`/api/exam/status/${filename}/`))
    .value as CategoryExam;
};
export const loadExamMetaData = async (filename: string) => {
  return (await fetchGet(`/api/exam/metadata/${filename}/`))
    .value as ExamMetaData;
};
export const loadSplitRenderer = async (filename: string) => {
  const pdf = await new Promise<PDFDocumentProxy>((resolve, reject) =>
    getDocument({
      url: filename,
      disableStream: true,
      disableAutoFetch: true,
    }).promise.then(resolve, reject),
  );
  const renderer = new PDF(pdf);
  return [pdf, renderer] as const;
};
export const loadCutVersions = async (filename: string) => {
  return (await fetchGet(`/api/exam/cutversions/${filename}/`))
    .value as CutVersions;
};
export const loadCuts = async (filename: string) => {
  return (await fetchGet(`/api/exam/cuts/${filename}/`))
    .value as ServerCutResponse;
};
export const loadPaymentCategories = async () => {
  return (await fetchGet("/api/category/listonlypayment/"))
    .value as CategoryMetaData[];
};
const loadAnswers = async (oid: string) => {
  const section = (await fetchGet(`/api/exam/answersection/${oid}/`))
    .value as AnswerSection;
  const getScore = (answer: Answer) => answer.expertvotes * 10 + answer.upvotes;
  section.answers.sort((a, b) => getScore(b) - getScore(a));
  return section;
};
export const useAnswers = (
  oid: string,
  onSuccess: (data: AnswerSection) => void,
) => {
  const { run } = useRequest(() => loadAnswers(oid), {
    manual: true,
    onSuccess,
  });
  return run;
};
const removeSplit = async (oid: string) => {
  return await fetchPost(`/api/exam/removecut/${oid}/`, {});
};
export const useRemoveSplit = (oid: string, onSuccess: () => void) => {
  const { run: runRemoveSplit } = useRequest(() => removeSplit(oid), {
    manual: true,
    onSuccess,
  });
  return runRemoveSplit;
};

const updateAnswer = async (
  answerId: string,
  text: string,
  kind: AnswerKind,
) => {
  return (await fetchPost(`/api/exam/setanswer/${answerId}/`, { text, kind }))
    .value as AnswerSection;
};
const removeAnswer = async (answerId: string) => {
  return (await fetchPost(`/api/exam/removeanswer/${answerId}/`, {}))
    .value as AnswerSection;
};
const setAnswerFlagged = async (oid: string, flagged: boolean) => {
  return (
    await fetchPost(`/api/exam/setanswerflagged/${oid}/`, {
      flagged,
    })
  ).value as AnswerSection;
};
const setAnswerMarkedAsAi = async (oid: string, marked_as_ai: boolean) => {
  return (
    await fetchPost(`/api/exam/setanswermarkedasai/${oid}/`, {
      marked_as_ai,
    })
  ).value as AnswerSection;
};
const resetAnswerFlagged = async (oid: string) => {
  return (await fetchPost(`/api/exam/resetanswerflagged/${oid}/`, {}))
    .value as AnswerSection;
};
const resetAnswerMarkedAsAi = async (oid: string) => {
  return (await fetchPost(`/api/exam/resetanswermarkedasai/${oid}/`, {}))
    .value as AnswerSection;
};
const setExamCommentFlagged = async (oid: string, flagged: boolean) => {
  return (
    await fetchPost(`/api/exam/setcommentflagged/${oid}/`, {
      flagged,
    })
  ).value as AnswerSection;
};
const setExamCommentMarkedAsAi = async (oid: string, marked_as_ai: boolean) => {
  return (
    await fetchPost(`/api/exam/setcommentmarkedasai/${oid}/`, {
      marked_as_ai,
    })
  ).value as AnswerSection;
};
const resetExamCommentFlagged = async (oid: string) => {
  return (await fetchPost(`/api/exam/resetcommentflagged/${oid}/`, {}))
    .value as AnswerSection;
};
const resetExamCommentMarkedAsAi = async (oid: string) => {
  return (await fetchPost(`/api/exam/resetcommentmarkedasai/${oid}/`, {}))
    .value as AnswerSection;
};
const setExpertVote = async (oid: string, vote: boolean) => {
  return (
    await fetchPost(`/api/exam/setexpertvote/${oid}/`, {
      vote,
    })
  ).value as AnswerSection;
};

export const useSetAnswerFlagged = (
  onSectionChanged?: (data: AnswerSection) => void,
) => {
  const { loading: setAnswerFlaggedLoading, run: runSetAnswerFlagged } =
    useRequest(setAnswerFlagged, { manual: true, onSuccess: onSectionChanged });
  return [setAnswerFlaggedLoading, runSetAnswerFlagged] as const;
};
export const useSetAnswerMarkedAsAi = (
  onSectionChanged?: (data: AnswerSection) => void,
) => {
  const { loading: setAnswerMarkedAsAiLoading, run: runSetAnswerMarkedAsAi } =
    useRequest(setAnswerMarkedAsAi, {
      manual: true,
      onSuccess: onSectionChanged,
    });
  return [setAnswerMarkedAsAiLoading, runSetAnswerMarkedAsAi] as const;
};
export const useSetExpertVote = (
  onSectionChanged?: (data: AnswerSection) => void,
) => {
  const { loading: setExpertVoteLoading, run: runSetExpertVote } = useRequest(
    setExpertVote,
    { manual: true, onSuccess: onSectionChanged },
  );
  return [setExpertVoteLoading, runSetExpertVote] as const;
};
export const useResetAnswerFlaggedVote = (
  onSectionChanged?: (data: AnswerSection) => void,
) => {
  const { loading: resetAnswerFlaggedLoading, run: runResetAnswerFlagged } =
    useRequest(resetAnswerFlagged, {
      manual: true,
      onSuccess: onSectionChanged,
    });
  return [resetAnswerFlaggedLoading, runResetAnswerFlagged] as const;
};
export const useResetAnswerMarkedAsAi = (
  onSectionChanged?: (data: AnswerSection) => void,
) => {
  const {
    loading: resetAnswerMarkedAsAiLoading,
    run: runResetAnswerMarkedAsAi,
  } = useRequest(resetAnswerMarkedAsAi, {
    manual: true,
    onSuccess: onSectionChanged,
  });
  return [resetAnswerMarkedAsAiLoading, runResetAnswerMarkedAsAi] as const;
};
export const useSetExamCommentFlagged = (
  onSectionChanged?: (data: AnswerSection) => void,
) => {
  const {
    loading: setExamCommentFlaggedLoading,
    run: runSetExamCommentFlagged,
  } = useRequest(setExamCommentFlagged, {
    manual: true,
    onSuccess: onSectionChanged,
  });
  return [setExamCommentFlaggedLoading, runSetExamCommentFlagged] as const;
};
export const useSetExamCommentMarkedAsAi = (
  onSectionChanged?: (data: AnswerSection) => void,
) => {
  const {
    loading: setExamCommentMarkedAsAiLoading,
    run: runSetExamCommentMarkedAsAi,
  } = useRequest(setExamCommentMarkedAsAi, {
    manual: true,
    onSuccess: onSectionChanged,
  });
  return [
    setExamCommentMarkedAsAiLoading,
    runSetExamCommentMarkedAsAi,
  ] as const;
};
export const useResetExamCommentFlaggedVote = (
  onSectionChanged?: (data: AnswerSection) => void,
) => {
  const {
    loading: resetExamCommentFlaggedLoading,
    run: runResetExamCommentFlagged,
  } = useRequest(resetExamCommentFlagged, {
    manual: true,
    onSuccess: onSectionChanged,
  });
  return [resetExamCommentFlaggedLoading, runResetExamCommentFlagged] as const;
};
export const useResetExamCommentMarkedAsAi = (
  onSectionChanged?: (data: AnswerSection) => void,
) => {
  const {
    loading: resetExamCommentMarkedAsAiLoading,
    run: runResetExamCommentMarkedAsAi,
  } = useRequest(resetExamCommentMarkedAsAi, {
    manual: true,
    onSuccess: onSectionChanged,
  });
  return [
    resetExamCommentMarkedAsAiLoading,
    runResetExamCommentMarkedAsAi,
  ] as const;
};
export const useUpdateAnswer = (onSuccess?: (data: AnswerSection) => void) => {
  const { loading: updating, run: runUpdateAnswer } = useRequest(updateAnswer, {
    manual: true,
    onSuccess,
  });
  return [updating, runUpdateAnswer] as const;
};
export const useRemoveAnswer = (
  onSectionChanged?: (data: AnswerSection) => void,
) => {
  const { run: runRemoveAnswer } = useRequest(removeAnswer, {
    manual: true,
    onSuccess: onSectionChanged,
  });
  return runRemoveAnswer;
};

export const useMutation = <B, T extends any[]>(
  service: (...args: T) => Promise<B>,
  onSuccess?: (res: B, params: T) => void,
) => {
  const { loading, run } = useRequest(service, { manual: true, onSuccess });
  return [loading, run] as const;
};

export const removeExam = async (filename: string) => {
  await fetchPost(`/api/exam/remove/exam/${filename}/`, {});
};

export const removeCategory = async (slug: string) => {
  await fetchPost("/api/category/remove/", { slug });
};
export const useRemoveCategory = (onSuccess?: () => void) =>
  useMutation(removeCategory, onSuccess);

export const markAsChecked = async (filename: string) => {
  return (await fetchPost(`/api/payment/markexamchecked/${filename}/`, {}))
    .value;
};

export const loadExamUserSolved = async (exam: string) => {
  return fetchGet<{ user_solved: boolean }>(`/api/exam/${exam}/usersolved`);
};

export const useLoadExamUserSolved = (exam: string) => {
  const {
    error,
    loading,
    data,
    mutate,
    run: reload,
  } = useRequest(() => loadExamUserSolved(exam), {
    cacheKey: `exam-${exam}-usersolved`,
  });
  return [error, loading, data, mutate, reload] as const;
};

export const markExamUserSolved = async (exam: string) => {
  return fetchPut<{ user_solved: boolean }>(`/api/exam/${exam}/usersolved`, {});
};
export const useMarkExamUserSolved = (exam: string) =>
  useMutation(() => markExamUserSolved(exam));

export const unmarkExamUserSolved = async (exam: string) => {
  return fetchDelete<{ user_solved: boolean }>(`/api/exam/${exam}/usersolved`);
};
export const useUnmarkExamUserSolved = (exam: string) =>
  useMutation(() => unmarkExamUserSolved(exam));

export const markCategoryUserPinned = async (slug: string) => {
  return fetchPut<{ category_pinned: boolean }>(
    `/api/category/${slug}/pinned/`,
    {},
  );
};

export const unmarkCategoryUserPinned = async (slug: string) => {
  return fetchDelete<{ category_pinned: boolean }>(
    `/api/category/${slug}/pinned/`,
  );
};
