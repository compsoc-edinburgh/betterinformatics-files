export type KeysWhereValue<T, S> = {
  [K in keyof T]: T[K] extends S ? K : never;
}[keyof T];

interface Options {
  [a: string]: string;
}
type OptionsResult<T> = {
  [key in keyof T]: { value: key; label: T[key] };
};
export const fromEntries = <T extends Array<[string, unknown]>>(o: T) =>
  o.reduce((prev: any, curr) => {
    prev[curr[0]] = curr[1];
    return prev;
  }, {});

export const createOptions = <T extends Options>(o: T) =>
  fromEntries(
    Object.entries(o).map(([key, value]) => [
      key,
      { value: key, label: value },
    ]) as Array<[string, unknown]>,
  ) as unknown as OptionsResult<T>;
export type SelectOption<T> = { value: keyof T; label: string };
export const options = <T>(map: OptionsResult<T>) =>
  Object.values(map) as Array<{ value: keyof T; label: string }>;
