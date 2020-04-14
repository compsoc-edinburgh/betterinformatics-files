import { fetchGet, fetchPost, fetchPut, fetchDelete } from "./fetch-utils";
import { FAQEntry } from "../interfaces";
import { useRequest } from "@umijs/hooks";

const laodFAQs = async () => {
  return (await fetchGet("/api/faq/")).value as FAQEntry[];
};
const addFAQ = async (question: string, answer: string, order: number) => {
  return (
    await fetchPost("/api/faq/", {
      question,
      answer,
      order,
    })
  ).value as FAQEntry;
};
const updateFAQ = async (oid: string, changes: Partial<FAQEntry>) => {
  return (await fetchPut(`/api/faq/${oid}/`, changes)).value as FAQEntry;
};
const swapFAQ = async (a: FAQEntry, b: FAQEntry) => {
  return Promise.all([
    updateFAQ(a.oid, { order: b.order }),
    updateFAQ(b.oid, { order: a.order }),
  ]);
};
const deleteFAQ = async (oid: string) => {
  await fetchDelete(`/api/faq/${oid}/`);
  return oid;
};
const sorted = (arg: FAQEntry[]) => arg.sort((a, b) => a.order - b.order);

export const useFAQ = () => {
  const { data: faqs, mutate } = useRequest(laodFAQs, { cacheKey: "faqs" });
  const { run: runAddFAQ } = useRequest(addFAQ, {
    manual: true,
    onSuccess: newFAQ => {
      mutate(prevEntries => sorted([...prevEntries, newFAQ]));
    },
  });
  const { run: runUpdateFAQ } = useRequest(updateFAQ, {
    manual: true,
    onSuccess: changed => {
      mutate(prevEntry =>
        sorted(
          prevEntry.map(entry => (entry.oid === changed.oid ? changed : entry)),
        ),
      );
    },
  });
  const { run: runSwapFAQ } = useRequest(swapFAQ, {
    manual: true,
    onSuccess: ([newA, newB]) => {
      mutate(prevEntry =>
        sorted(
          prevEntry.map(entry =>
            entry.oid === newA.oid
              ? newA
              : entry.oid === newB.oid
              ? newB
              : entry,
          ),
        ),
      );
    },
  });
  const { run: runDeleteFAQ } = useRequest(deleteFAQ, {
    manual: true,
    onSuccess: removedOid =>
      mutate(prevEntry => prevEntry.filter(entry => entry.oid !== removedOid)),
  });
  return {
    faqs,
    add: runAddFAQ,
    update: runUpdateFAQ,
    swap: runSwapFAQ,
    remove: runDeleteFAQ,
  } as const;
};
