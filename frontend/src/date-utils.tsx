// takes a date string formatted in ISO and returns in CH locale
export function dateStr2Str(dateStr: string) {
  let date = new Date(dateStr);
  return date.getDate() + '.' + date.getMonth() + '.' + date.getFullYear() + ' ' + date.getHours() + ':' + date.getMinutes();
}
