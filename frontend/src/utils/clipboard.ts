export const copy = (text: string) => {
  // Async, just fire and forget, ignore errors
  void navigator.clipboard.writeText(text);
};
