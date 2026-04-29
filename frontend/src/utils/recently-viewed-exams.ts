export interface RecentExam {
  filename: string;
  displayname: string;
  category: string;
  category_displayname: string;
  viewedAt: number;
}

export const RECENT_EXAMS_KEY = "recently-viewed-exams";
export const MAX_RECENT_EXAMS = 5;

export function pushRecentExam(
  list: RecentExam[],
  exam: Omit<RecentExam, "viewedAt">,
): RecentExam[] {
  const filtered = list.filter(e => e.filename !== exam.filename);
  return [{ ...exam, viewedAt: Date.now() }, ...filtered].slice(
    0,
    MAX_RECENT_EXAMS,
  );
}
