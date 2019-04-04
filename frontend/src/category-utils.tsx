import {CategoryMetaData} from "./interfaces";

function filterMatches(filter: string, name: string): boolean {
  let nameLower = name.replace(/\s/g, '').toLowerCase();
  let filterLower = filter.replace(/\s/g, '').toLowerCase();
  if (filter.length === 0) {
    return true;
  }
  let fpos = 0;
  for(let npos = 0; npos < nameLower.length; npos++) {
    if (filterLower[fpos] === nameLower[npos]) {
      fpos++;
      if (fpos === filterLower.length) {
        return true;
      }
    }
  }
  return false;
}

export function filterCategories(categories: CategoryMetaData[], filter: string,): CategoryMetaData[] {
  return categories.filter(cat => filterMatches(filter, cat.category));
}
