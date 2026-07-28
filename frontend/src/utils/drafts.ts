const draftPartKey = "draft-ans/com-json";
const lifeSpan = 1000 * 60 * 60 * 24 * 30; // 1 Month

type StorageDraft = Record<
  string,
  {
    draftTime: number;
    draft: string;
  }
>;

export function saveDraftToStorage(
  oId: string | undefined,
  newValue: string,
  isAnswer: boolean,
) {
  if (oId === undefined) {
    return;
  }
  const part = isAnswer ? "answers" : "comments";
  const partFromLocalStorage =
    localStorage.getItem(draftPartKey) ?? '{"answers": {},"comments": {}}';
  const draftJSON = JSON.parse(partFromLocalStorage);
  const draftPartJSON = draftJSON[part] as StorageDraft;
  const now = new Date();
  const currentTimeStamp = now.getTime();
  if (newValue.length === 0) {
    const { [oId]: _, ...remaining } = draftPartJSON;
    draftJSON[part] = remaining;
  } else {
    draftPartJSON[oId] = {
      draft: newValue,
      draftTime: currentTimeStamp,
    };
  }
  localStorage.setItem(draftPartKey, JSON.stringify(draftJSON));
}

export function readDraftFromStorage(
  oId: string | undefined,
  isAnswer: boolean,
): string {
  if (oId === undefined) {
    return "";
  }
  const part = isAnswer ? "answers" : "comments";
  const partFromLocalStorage =
    localStorage.getItem(draftPartKey) ?? '{"answers": {},"comments": {}}';
  const draftJSON = JSON.parse(partFromLocalStorage)[part] as StorageDraft;
  const text = draftJSON[oId]?.draft ?? "";
  return text;
}

export function clearExpiredDrafts() {
  const partFromLocalStorage =
    localStorage.getItem(draftPartKey) ?? '{"answers": {},"comments": {}}';
  const draftAnswersJSON = JSON.parse(partFromLocalStorage)[
    "answers"
  ] as StorageDraft;
  const draftCommentsJSON = JSON.parse(partFromLocalStorage)[
    "comments"
  ] as StorageDraft;
  const now = new Date();
  const currentTimeStamp = now.getTime();
  // Answers
  Object.entries(draftAnswersJSON).forEach(([answerId, element]) => {
    if (element.draftTime + lifeSpan < currentTimeStamp) {
      saveDraftToStorage(answerId, "", true);
    }
  });
  // Comments
  Object.entries(draftCommentsJSON).forEach(([answerId, element]) => {
    if (element.draftTime + lifeSpan < currentTimeStamp) {
      saveDraftToStorage(answerId, "", false);
    }
  });
}
