import {Category, Exam} from "./interfaces";

interface TempCategory {
  childs: object;
  exams: Exam[];
}

function splitCategory(category: string) {
  const first = category.split("/", 1)[0];
  if (first === category) {
    return [first, ""];
  }
  const last = category.substr(first.length+1);
  return [first, last];
}

function flattenRoots(prefix: string, roots: TempCategory): Category[] {
  let res: Category[] = [];
  for (var k in roots.childs){
    if (roots.childs.hasOwnProperty(k)) {
      const fullName = prefix.length === 0 ? k : prefix + "/" + k;
      res.push({
        name: fullName,
        exams: roots.childs[k].exams,
        childCategories: flattenRoots(fullName, roots.childs[k])
      });
    }
  }
  return res;
}

export function buildCategoryTree(serverCategories: Category[]): Category[] {
  let roots: TempCategory = {childs: {}, exams: []};

  serverCategories.forEach((category) => {
    let curName = category.name;
    let curList = roots;
    while (curName.length > 0) {
      const [first, last] = splitCategory(curName);
      if (!curList.childs[first]) {
        curList.childs[first] = {childs: {}, exams: []};
      }
      if (last.length === 0) {
        curList.childs[first].exams.push.apply(curList.childs[first].exams, category.exams);
        break;
      }
      curName = last;
      curList = curList.childs[first];
    }
  });

  return flattenRoots("", roots);
}

export function synchronizeTreeWithStack(categoryTree: Category[], categoryStack: Category[]) {
  let curList: Category[] = categoryTree;
  categoryStack[0].childCategories = categoryTree;
  for(let curPos = 1; curPos < categoryStack.length; curPos++) {
    const nextName = categoryStack[curPos].name;
    for(let i = 0; i < curList.length; i++) {
      if (curList[i].name === nextName) {
        categoryStack[curPos] = curList[i];
        const childs = curList[i].childCategories;
        if (childs) {
          curList = childs;
        } else {
          return categoryStack;
        }
        break;
      }
    }
  }
  return categoryStack;
}

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

export function filterCategoryTree(categoryTree: Category[], filter: string, matchOnExams: boolean): Category[] {
  return categoryTree.map(cat => ({
    name: cat.name,
    childCategories: cat.childCategories ? filterCategoryTree(cat.childCategories, filter, matchOnExams) : undefined,
    exams: matchOnExams ? cat.exams.filter(exam => filterMatches(filter, cat.name + "/" + exam.displayname)) : cat.exams
  })).filter(cat =>
    filterMatches(filter, cat.name) ||
    (matchOnExams && cat.exams.length > 0) ||
    (cat.childCategories && cat.childCategories.length > 0));
}