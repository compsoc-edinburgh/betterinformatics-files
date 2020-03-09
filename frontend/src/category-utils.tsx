import {
  CategoryExam,
  CategoryMetaDataAny,
  MetaCategory,
  MetaCategoryWithCategories,
} from "./interfaces";

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
  for (let category of categories) {
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
  categories: CategoryMetaDataAny[],
  metaCategories: MetaCategory[],
): MetaCategoryWithCategories[] {
  const categoryToMeta: { [key: string]: CategoryMetaData } = {};
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
