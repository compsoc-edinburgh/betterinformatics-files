export const copy = (text: string) => {
  const textarea = document.createElement("textarea");
  textarea.innerText = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
};
