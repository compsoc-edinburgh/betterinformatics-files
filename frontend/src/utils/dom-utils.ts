export function highlightWordsInTextNode(
  revert: (() => void)[],
  element: Text,
  regex: RegExp,
) {
  const text = element.nodeValue || "";
  const m = regex.test(text);
  if (!m) return;
  const el = document.createElement("span");
  let i = 0;
  while (i < text.length) {
    const rest = text.substring(i);
    const m = rest.match(regex);
    if (m) {
      const start = m.index || 0;
      const t = document.createTextNode(rest.substring(0, start));
      el.appendChild(t);

      const mark = document.createElement("mark");
      mark.innerText = m[0];
      el.appendChild(mark);

      i += start + m[0].length;
    } else {
      const t = document.createTextNode(rest);
      el.appendChild(t);
      break;
    }
  }
  const parentNode = element.parentNode!;
  revert.push(() => {
    parentNode.replaceChild(element, el);
  });
  parentNode.replaceChild(el, element);
}
export function highlightWords(
  revert: (() => void)[],
  element: HTMLElement,
  regex: RegExp,
) {
  const children = element.childNodes;
  for (let i = 0; i < children.length; i++) {
    const c = children[i];
    if (c.nodeType === Node.TEXT_NODE) {
      highlightWordsInTextNode(revert, c as Text, regex);
    } else if (c instanceof HTMLElement) {
      highlightWords(revert, c, regex);
    }
  }
}
