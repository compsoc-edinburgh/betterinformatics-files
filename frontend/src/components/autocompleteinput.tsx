import * as React from "react";

interface Props {
  name: string,
  value: string,
  placeholder: string,
  autocomplete: string[],
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export default ({ name, value, placeholder, autocomplete, onChange }: Props) => (
  <React.Fragment>
    <input type="text" list={name + "_list"} name={name} placeholder={placeholder} value={value} onChange={onChange} autoComplete="off" />
    <datalist id={name + "_list"}>
      {autocomplete.map(entry => (
        <option key={entry} value={entry} />
      ))}
    </datalist>
  </React.Fragment>
);
