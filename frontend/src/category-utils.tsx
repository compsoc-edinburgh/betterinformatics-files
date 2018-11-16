import {Exam, Category} from "./interfaces";

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