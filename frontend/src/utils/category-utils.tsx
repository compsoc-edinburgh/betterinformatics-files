import {
  CategoryExam,
  CategoryMetaDataAny,
  CategoryMetaDataOverview,
  MetaCategory,
  MetaCategoryWithCategories,
  ExamSelectedForDownload,
} from "../interfaces";
import { fetchGet } from "../api/fetch-utils";
import { downloadZipFile, type ZipFileItem } from "./download-zip-file.js";

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
  const categoryToMeta: Record<string, CategoryMetaDataOverview> = {};
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
        meta2 => meta2.categories.includes(category),
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
export const dlSelectedExams = async (
  selectedExams: ExamSelectedForDownload[],
) => {
  const zipFileItems = selectedExams.map(
    async (exam): Promise<ZipFileItem | undefined> => {
      const responseUrl = await fetchGet(
        `/api/exam/pdf/exam/${exam.filename}/`,
      );
      const responseFile = fetch(responseUrl.value).then(r => r.arrayBuffer());

      return {
        displayName: exam.displayname,
        filename: exam.filename,
        file: responseFile,
      };
    },
  );

  await downloadZipFile("exams.zip", zipFileItems);
};
/**
 * Strip the YAML frontmatter (if it exists) from a raw markdown file content,
 * and any leading newlines.
 * @param markdown Raw markdowwn string
 * @returns Stripped raw markdown string
 */
export const removeMarkdownFrontmatter = (markdown: string) => {
  const regex = /^---[\s\S]*?---\n+/;
  return markdown.replace(regex, "");
};
/**
 * Determine if a link to a markdown file is on GitHub, and if so, construct an
 * edit link for it.
 * @param link Link to a raw markdown file
 * @returns Whether the link is editable on GitHub and if so, an edit link
 */
export const useEditableMarkdownLink = (link: string | undefined) => {
  // Only editable if it's a link to a public file on GitHub
  if (!link || !link.includes("raw.githubusercontent.com")) {
    return {
      editable: false,
      link: undefined,
    };
  }

  // Generate the edit link by inserting /edit/ into the URL and changing the
  // domain -- this leads directly to the editor for the file on GitHub
  const editLink = link.replace("raw.githubusercontent.com", "github.com");
  const pathComponents = editLink.split("/");
  const thirdPathComponent = pathComponents[4];
  const newEditLink = editLink.replace(
    thirdPathComponent,
    `${thirdPathComponent}/edit`,
  );
  return {
    editable: true,
    link: newEditLink,
  };
};
