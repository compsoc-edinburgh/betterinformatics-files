import * as React from "react";
import {css} from "glamor";
import {ExamMetaData} from "../interfaces";
import {fetchpost} from "../fetch-utils";
import Colors from "../colors";

const styles = {
  wrapper: css({
    marginRight: "20px",
  }),
  editBackground: css({
    background: Colors.headerBackground,
  }),
};

interface Props {
  filename?: string;
  savedMetaData: ExamMetaData;
  onChange: (newMetaData: ExamMetaData) => void;
}

interface State {
  editing: boolean;
  currentMetaData: ExamMetaData;
}

export default class MetaData extends React.Component<Props, State> {
  state: State = {
    editing: false,
    currentMetaData: this.props.savedMetaData,
  };

  startEdit = () => {
    this.setState({
      editing: true,
      currentMetaData: {...this.props.savedMetaData},
    });
  };

  saveEdit = () => {
    fetchpost(`/api/exam/${this.props.filename}/metadata`, {
      displayname: this.state.currentMetaData.displayname,
      legacy_solution: this.state.currentMetaData.legacy_solution,
      master_solution: this.state.currentMetaData.master_solution,
    })
      .then(() => {
        this.setState({editing: false});
        this.props.onChange(this.state.currentMetaData);
      })
      .catch(() => undefined);
  };

  cancelEdit = () => {
    this.setState({
      editing: false,
    });
  };

  valueChanged = (key: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = event.target.value;
    this.setState(prevState => {
      prevState.currentMetaData[key] = newVal;
      return prevState;
    });
  };

  render() {
    if (this.state.editing) {
      return (<div {...styles.wrapper} {...styles.editBackground}>
        <input type="text" placeholder="legacy solution" value={this.state.currentMetaData.legacy_solution} onChange={(ev) => this.valueChanged("legacy_solution", ev)}/>
        <input type="text" placeholder="master solution" value={this.state.currentMetaData.master_solution} onChange={(ev) => this.valueChanged("master_solution", ev)}/>
        <input type="text" placeholder="display name" value={this.state.currentMetaData.displayname} onChange={(ev) => this.valueChanged("displayname", ev)}/>
        <button onClick={this.saveEdit}>Save</button> <button onClick={this.cancelEdit}>Cancel</button>
      </div>);
    } else {
      return (<div {...styles.wrapper}><button onClick={this.startEdit}>Edit Metadata</button></div>);
    }
  }
}