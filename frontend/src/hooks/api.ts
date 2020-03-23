import { fetchpost, fetchapi } from "../fetch-utils";
import {
  PaymentInfo,
  UserInfo,
  NotificationInfo,
  Answer,
  CategoryMetaDataMinimal,
  CategoryMetaData,
  MetaCategory,
  CategoryExam,
  ExamMetaData,
  CutVersions,
  ServerCutResponse,
  FeedbackEntry,
} from "../interfaces";
import { useRequest } from "@umijs/hooks";
import { PDFDocumentProxy, getDocument } from "../pdfjs";
import PDF from "../pdf-renderer";

const loadUserInfo = async (username: string) => {
  return (await fetchapi(`/api/scoreboard/userinfo/${username}/`))
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
      (await fetchapi(`/api/notification/getenabled/`)).value,
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
  await fetchpost(`/api/notification/setenabled/`, {
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
  return (await fetchapi(query)).value as PaymentInfo[];
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
  return (await fetchpost("/api/payment/pay/", { username })).value;
};
export const useAddPayments = (cb: () => void) => {
  const { error, loading, run } = useRequest(addPayment, {
    manual: true,
    onSuccess: cb,
  });
  return [error, loading, run] as const;
};
const removePayment = async (payment: string) => {
  return await fetchpost(`/api/payment/remove/${payment}/`, {});
};
export const useRemovePayment = (cb: () => void) => {
  const { error, loading, run } = useRequest(removePayment, {
    manual: true,
    onSuccess: cb,
  });
  return [error, loading, run] as const;
};
const refundPayment = async (payment: string) => {
  return await fetchpost(`/api/payment/refund/${payment}/`, {});
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
    return (await fetchapi("/api/notification/all/"))
      .value as NotificationInfo[];
  } else {
    return (await fetchapi("/api/notification/unread/"))
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
const markAllRead = async (ids: string[]) => {
  return Promise.all(
    ids.map(oid =>
      fetchpost(`/api/notification/setread/${oid}/`, {
        read: true,
      }),
    ),
  );
};
export const useMarkAsRead = () => {
  const { error, loading, run } = useRequest(markAllRead, {
    manual: true,
  });
  return [error, loading, (...args: string[]) => run(args)] as const;
};
const loadUserAnswers = async (username: string) => {
  return (await fetchapi(`/api/exam/listbyuser/${username}/`))
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
const logout = async () => {
  await fetchpost("/api/auth/logout/", {});
};
export const useLogout = (cb: () => void = () => {}) => {
  const { error, loading, run } = useRequest(logout, {
    manual: true,
    onSuccess: cb,
  });
  return [error, loading, run] as const;
};
export const loadCategories = async () => {
  return (await fetchapi("/api/category/listonlyadmin/"))
    .value as CategoryMetaDataMinimal[];
};
export const uploadPdf = async (
  file: Blob,
  displayname: string,
  category: string,
) => {
  return (
    await fetchpost("/api/exam/upload/exam/", { file, displayname, category })
  ).filename as string;
};
export const loadCategoryMetaData = async (slug: string) => {
  return (await fetchapi(`/api/category/metadata/${slug}`))
    .value as CategoryMetaData;
};
export const loadMetaCategories = async () => {
  return (await fetchapi("/api/category/listmetacategories"))
    .value as MetaCategory[];
};
export const loadList = async (slug: string) => {
  return (await fetchapi(`/api/category/listexams/${slug}`))
    .value as CategoryExam[];
};
export const claimExam = async (filename: string, claim: boolean) => {
  await fetchpost(`/api/exam/claimexam/${filename}/`, {
    claim,
  });
};
export const loadExamMetaData = async (filename: string) => {
  return (await fetchapi(`/api/exam/metadata/${filename}/`))
    .value as ExamMetaData;
};
export const loadSplitRenderer = async (filename: string) => {
  const pdf = await new Promise<PDFDocumentProxy>((resolve, reject) =>
    getDocument(`/api/exam/pdf/exam/${filename}`).promise.then(resolve, reject),
  );
  const renderer = new PDF(pdf);
  return [pdf, renderer] as const;
};
export const loadCutVersions = async (filename: string) => {
  return (await fetchapi(`/api/exam/cutversions/${filename}/`))
    .value as CutVersions;
};
export const loadCuts = async (filename: string) => {
  return (await fetchapi(`/api/exam/cuts/${filename}/`))
    .value as ServerCutResponse;
};
export const submitFeedback = async (text: string) => {
  return await fetchpost("api/feedback/submit/", { text });
};
export const loadFeedback = async () => {
  const fb = (await fetchapi("/api/feedback/list/")).value as FeedbackEntry[];
  const getScore = (a: FeedbackEntry) => (a.read ? 10 : 0) + (a.done ? 1 : 0);
  fb.sort((a: FeedbackEntry, b: FeedbackEntry) => getScore(a) - getScore(b));
  return fb;
};
