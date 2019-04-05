import * as React from "react";

interface Props {
  name: string;
  value: string;
  placeholder: string;
  autocomplete: string[];
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default class AutocompleteInput extends React.Component<Props> {
  render() {
    return (
      <React.Fragment>
        <input type="text" list={this.props.name + "_list"} name={this.props.name} placeholder={this.props.placeholder}
               value={this.props.value} onChange={this.props.onChange}
               autoComplete="off"/>
        <datalist id={this.props.name + "_list"}>
          {this.props.autocomplete.map(entry => (
            <option key={entry} value={entry}/>
          ))}
        </datalist>
      </React.Fragment>
    );
  }
}