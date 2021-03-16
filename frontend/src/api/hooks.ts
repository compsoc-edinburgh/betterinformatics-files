import { useRequest } from "@umijs/hooks";
import { PDFDocumentProxy } from "pdfjs-dist/types/display/api";
import {
  Answer,
  AnswerSection,
  CategoryExam,
  CategoryMetaData,
  CategoryMetaDataMinimal,
  CutVersions,
  ExamMetaData,
  FeedbackEntry,
  MetaCategory,
  NotificationInfo,
  PaymentInfo,
  ServerCutResponse,
  UserInfo,
} from "../interfaces";
import PDF from "../pdf/pdf-renderer";
import { getDocument } from "../pdf/pdfjs";
import { fetchGet, fetchPost } from "./fetch-utils";

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
const loadUserAnswers = async (username: string) => {
  return (await fetchGet(`/api/exam/listbyuser/${username}/`))
    .value as Answer[];
};
export const useUserAnswers = (username: string) => {
  const { error, loading, data, run } = useRequest(
    () => loadUserAnswers(username),
    {
      refreshDeps: [username],
      cacheKey: `user-answers-${username}`,
    },
  );
  return [error, loading, data, run] as const;
};
export const loadCategories = async () => {
  return (await fetchGet("/api/category/listonlyadmin/"))
    .value as CategoryMetaDataMinimal[];
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
  const { error, loading, data } = useRequest(loadMetaCategories);
  return [error, loading, data] as const;
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
export const loadExamMetaData = async (filename: string) => {
  return (await fetchGet(`/api/exam/metadata/${filename}/`))
    .value as ExamMetaData;
};
export const loadSplitRenderer = async (filename: string) => {
  const { value: signedUrl } = await fetchGet(
    `/api/exam/pdf/exam/${filename}/`,
  );
  const pdf = await new Promise<PDFDocumentProxy>((resolve, reject) =>
    getDocument({
      url: signedUrl,
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
export const submitFeedback = async (text: string) => {
  return await fetchPost("/api/feedback/submit/", { text });
};
export const loadFeedback = async () => {
  const fb = (await fetchGet("/api/feedback/list/")).value as FeedbackEntry[];
  const getScore = (a: FeedbackEntry) => (a.read ? 10 : 0) + (a.done ? 1 : 0);
  fb.sort((a: FeedbackEntry, b: FeedbackEntry) => getScore(a) - getScore(b));
  return fb;
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
  legacy_answer: boolean,
) => {
  return (
    await fetchPost(`/api/exam/setanswer/${answerId}/`, { text, legacy_answer })
  ).value as AnswerSection;
};
const removeAnswer = async (answerId: string) => {
  return (await fetchPost(`/api/exam/removeanswer/${answerId}/`, {}))
    .value as AnswerSection;
};
const setFlagged = async (oid: string, flagged: boolean) => {
  return (
    await fetchPost(`/api/exam/setflagged/${oid}/`, {
      flagged,
    })
  ).value as AnswerSection;
};
const resetFlagged = async (oid: string) => {
  return (await fetchPost(`/api/exam/resetflagged/${oid}/`, {}))
    .value as AnswerSection;
};
const setExpertVote = async (oid: string, vote: boolean) => {
  return (
    await fetchPost(`/api/exam/setexpertvote/${oid}/`, {
      vote,
    })
  ).value as AnswerSection;
};

export const useSetFlagged = (
  onSectionChanged?: (data: AnswerSection) => void,
) => {
  const {
    loading: setFlaggedLoading,
    run: runSetFlagged,
  } = useRequest(setFlagged, { manual: true, onSuccess: onSectionChanged });
  return [setFlaggedLoading, runSetFlagged] as const;
};
export const useSetExpertVote = (
  onSectionChanged?: (data: AnswerSection) => void,
) => {
  const {
    loading: setExpertVoteLoading,
    run: runSetExpertVote,
  } = useRequest(setExpertVote, { manual: true, onSuccess: onSectionChanged });
  return [setExpertVoteLoading, runSetExpertVote] as const;
};
export const useResetFlaggedVote = (
  onSectionChanged?: (data: AnswerSection) => void,
) => {
  const {
    loading: resetFlaggedLoading,
    run: runResetFlagged,
  } = useRequest(resetFlagged, { manual: true, onSuccess: onSectionChanged });
  return [resetFlaggedLoading, runResetFlagged] as const;
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
  onSuccess?: (res: B) => void,
) => {
  const { loading, run } = useRequest(service, { manual: true, onSuccess });
  return [loading, run] as const;
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
