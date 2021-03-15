import {
  CategoryExam,
  CategoryMetaDataAny,
  CategoryMetaDataOverview,
  MetaCategory,
  MetaCategoryWithCategories,
} from "../interfaces";
import { fetchGet } from "../api/fetch-utils";

export function filterMatches(filter: string, name: string): boolean {
  const nameLower = name.replace(/\s/g, "").toLowerCase();
  const filterLower = filter.replace(/\s/g, "").toLowerCase();
  if (filter.length === 0) {
    return true;
  }
  let fpos = 0;
  for (let npos = 0; npos < nameLower.length; npos++) {
    if (filterLower[fpos] === nameLower[npos]) {
      fpos++;
      if (fpos === filterLower.length) {
        return true;
      }
    }
  }
  return false;
}

export function findCategoryByName<T extends CategoryMetaDataAny>(
  categories: T[],
  displayname: string,
): T | null {
  for (const category of categories) {
    if (category.displayname === displayname) {
      return category;
    }
  }
  return null;
}

export function filterCategories<T extends CategoryMetaDataAny>(
  categories: T[],
  filter: string,
): T[] {
  return categories.filter(cat => filterMatches(filter, cat.displayname));
}

export function filterExams(
  exams: CategoryExam[],
  filter: string,
): CategoryExam[] {
  return exams.filter(ex => filterMatches(filter, ex.displayname));
}

export function fillMetaCategories(
  categories: CategoryMetaDataOverview[],
  metaCategories: MetaCategory[],
): MetaCategoryWithCategories[] {
  const categoryToMeta: { [key: string]: CategoryMetaDataOverview } = {};
  categories.forEach(cat => {
    categoryToMeta[cat.slug] = cat;
  });
  return metaCategories
    .map(meta1 => ({
      ...meta1,
      meta2: meta1.meta2
        .map(meta2 => ({
          ...meta2,
          categories: meta2.categories
            .filter(cat => categoryToMeta.hasOwnProperty(cat))
            .map(cat => categoryToMeta[cat]),
        }))
        .filter(meta2 => meta2.categories.length > 0),
    }))
    .filter(meta1 => meta1.meta2.length > 0);
}

export function getMetaCategoriesForCategory(
  metaCategories: MetaCategory[],
  category: string,
): MetaCategory[] {
  return metaCategories
    .map(meta1 => ({
      ...meta1,
      meta2: meta1.meta2.filter(
        meta2 => meta2.categories.indexOf(category) !== -1,
      ),
    }))
    .filter(meta1 => meta1.meta2.length > 0);
}
export const mapExamsToExamType = (exams: CategoryExam[]) => {
  return [
    ...exams
      .reduce((map, exam) => {
        const examtype = exam.examtype ?? "Exams";
        const arr = map.get(examtype);
        if (arr) {
          arr.push(exam);
        } else {
          map.set(examtype, [exam]);
        }
        return map;
      }, new Map<string, CategoryExam[]>())
      .entries(),
  ].sort(([a], [b]) => a.localeCompare(b));
};
export const dlSelectedExams = async (selectedExams: Set<string>) => {
  const JSZip = await import("jszip").then(e => e.default);
  const zip =  new JSZip();

  
  await Promise.all(
      Array.from(selectedExams).map(async (exam) => {
        const responseUrl = await fetchGet(`/api/exam/pdf/exam/${exam}/`);
        const responseFile = await fetch(responseUrl.value).then(r => r.arrayBuffer())
        zip.file(exam, responseFile);
      })
  );

  const content = await zip.generateAsync({ type: "blob" });
  const name = "exams.zip";
  const url = window.URL.createObjectURL(content);

  const a = document.createElement("a");
  a.href = url;
  a.download = name;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};
