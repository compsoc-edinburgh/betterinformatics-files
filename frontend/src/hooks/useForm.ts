import React, { useCallback, useDebugValue, useRef, useState } from "react";

type KeysWhereValue<T, S> = {
  [K in keyof T]: T[K] extends S ? K : never;
}[keyof T];
interface FormData {
  [name: string]: any;
}
interface InputElement<T> {
  value: T;
  defaultValue: T;
}
interface CheckedElement {
  checked: boolean;
  defaultChecked: boolean;
}
type ResetFnMap<T extends FormData> = {
  [name in keyof T]?: () => void;
};
/**
 * A hook which can be used to manage a form that consists of
 * both uncontrolled and controlled input elements. Uncontrolled
 * input elements are generally preferred.
 * @param initialData The initial data the form should be populated
 * with. Include keys that are initially undefined as this value
 * will be used to infer the form data type.
 * @param formSubmit An optional callback that is invoked with the
 * current data when the returned onSubmit is invoked.
 * @param _state An array of keys that are controlled by controlled
 * input elements. Currently this array is only used for type-checking
 * @example
 * const {
 *   registerInput,
 *   registerCheckbox,
 *   onSubmit
 * } = useForm({
 *     name: "",
 *     password: "",
 *   },
 *   ({name, password}) =>
 *     login(name, password),
 *   []
 * );
 */
const useForm = <
  S extends keyof T,
  T extends FormData,
  K extends (data: T, reset: () => void) => any,
>(
  initialData: T,
  formSubmit?: K,
  _state: S[] = [],
) => {
  const ref = useRef({ ...initialData });
  useDebugValue(ref.current);
  const [state, setState] = useState<Pick<T, S>>({ ...initialData });
  const resetFnMap = useRef<ResetFnMap<T>>({});
  const getValues = useCallback(() => {
    return ref.current;
  }, []);
  const setValue = useCallback(<A extends keyof T>(name: A, value: T[A]) => {
    ref.current[name] = value;
  }, []);
  const onChangeTransform = useCallback(
    <B extends keyof T, M, A extends React.ChangeEvent<M>>(
      name: B,
      e: A,
      transform: (val: M) => T[B],
    ) => {
      setValue(name, transform(e.target));
    },
    [setValue],
  );
  const setStateValue = useCallback(
    <K extends S>(key: K, value: T[S]) => {
      setValue(key, value);
      setState(prevState => ({ ...prevState, [key]: value }));
    },
    [setValue],
  );
  const register = useCallback(
    <K extends keyof T, M, S>(
      name: K,
      transform: (val: M) => T[K],
      valueTransform: (val: T[K]) => S,
    ) => {
      const handler = <A extends React.ChangeEvent<M>>(e: A) =>
        onChangeTransform(name, e, transform);
      return {
        ...valueTransform(getValues()[name]),
        onChange: handler,
      } as const;
    },
    [getValues, onChangeTransform],
  );

  const registerInput = useCallback(
    <K extends keyof T>(name: K) => {
      return register<K, InputElement<T[K]>, Partial<InputElement<T[K]>>>(
        name,
        e => {
          resetFnMap.current[name] = () => (e.value = initialData[name]);

          return e.value;
        },
        v => ({
          defaultValue: v,
        }),
      );
    },
    [register, initialData],
  );
  const registerCheckbox = useCallback(
    <K extends KeysWhereValue<T, boolean>>(name: K) => {
      return register<K, CheckedElement, Partial<CheckedElement>>(
        name,
        e => {
          resetFnMap.current[name] = () => (e.checked = initialData[name]);

          return e.checked as T[K];
        },
        v => ({ defaultChecked: v }),
      );
    },
    [register, initialData],
  );

  const reset = useCallback(() => {
    ref.current = { ...initialData };
    for (const key in resetFnMap.current) {
      if (Object.prototype.hasOwnProperty.call(resetFnMap.current, key)) {
        const fn = resetFnMap.current[key];
        if (fn) fn();
      }
    }
    resetFnMap.current = {};
    setState({ ...initialData });
  }, [initialData]);

  const onSubmit = useCallback(
    <T>(e: React.FormEvent<T>) => {
      e.preventDefault();
      e.stopPropagation();
      if (formSubmit) formSubmit(getValues(), reset);
    },
    [formSubmit, getValues, reset],
  );
  return {
    reset,
    register,

    registerInput,
    registerCheckbox,

    formState: state,
    setFormValue: setStateValue,

    onSubmit,

    getFormValues: getValues,
  } as const;
};

export default useForm;
