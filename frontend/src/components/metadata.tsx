import * as React from "react";
import {css} from "glamor";
import {ExamMetaData} from "../interfaces";
import {fetchpost} from "../fetch-utils";
import Colors from "../colors";

const styles = {
  wrapper: css({
    width: "430px",
    margin: "auto",
    marginBottom: "20px",
    padding: "10px",
    background: Colors.cardBackground,
    boxShadow: Colors.cardShadow,
    "& input[type=text]": {
      width: "200px",
    },
    "& label": {
      width: "200px",
      margin: "5px",
      display: "inline-block",
    },
    "& button": {
      width: "200px",
    },
  }),
};

interface Props {
  filename?: string;
  savedMetaData: ExamMetaData;
  onChange: (newMetaData: ExamMetaData) => void;
  onFinishEdit: () => void;
}

interface State {
  currentMetaData: ExamMetaData;
}

export default class MetaData extends React.Component<Props, State> {
  state: State = {
    currentMetaData: this.props.savedMetaData,
  };

  startEdit = () => {
    this.setState({
      currentMetaData: {...this.props.savedMetaData},
    });
  };

  saveEdit = () => {
    fetchpost(`/api/exam/${this.props.filename}/metadata`, this.state.currentMetaData)
      .then(() => {
        this.props.onChange(this.state.currentMetaData);
        this.props.onFinishEdit();
      })
      .catch(() => undefined);
  };

  cancelEdit = () => {
    this.setState({
      currentMetaData: this.props.savedMetaData
    });
    this.props.onFinishEdit();
  };

  valueChanged = (key: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = event.target.value;
    this.setState(prevState => {
      prevState.currentMetaData[key] = newVal;
      return prevState;
    });
  };

  checkboxValueChanged = (key: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = event.target.checked;
    this.setState(prevState => {
      prevState.currentMetaData[key] = newVal;
      return prevState;
    });
  };

  render() {
    return (<div {...styles.wrapper}>
      <div>
        <input type="text" placeholder="display name" value={this.state.currentMetaData.displayname} onChange={(ev) => this.valueChanged("displayname", ev)}/>
        <input type="text" placeholder="resolve alias" value={this.state.currentMetaData.resolve_alias} onChange={(ev) => this.valueChanged("resolve_alias", ev)}/>
      </div>
      <div>
        <input type="text" placeholder="legacy solution" value={this.state.currentMetaData.legacy_solution} onChange={(ev) => this.valueChanged("legacy_solution", ev)}/>
        <input type="text" placeholder="master solution" value={this.state.currentMetaData.master_solution} onChange={(ev) => this.valueChanged("master_solution", ev)}/>
      </div>
      <div>
        <input type="text" placeholder="remark" value={this.state.currentMetaData.remark} onChange={(ev) => this.valueChanged("remark", ev)}/>
        <input type="text" placeholder="payment category" value={this.state.currentMetaData.payment_category} onChange={(ev) => this.valueChanged("payment_category", ev)}/>
      </div>
      <div>
        <label>
          <input type="checkbox" checked={this.state.currentMetaData.public} onChange={(ev) => this.checkboxValueChanged("public", ev)}/>
          Public
        </label>
        <label>
          <input type="checkbox" checked={this.state.currentMetaData.print_only} onChange={(ev) => this.checkboxValueChanged("print_only", ev)}/>
          Print Only
        </label>
      </div>
      <div>
        <button onClick={this.saveEdit}>Save</button>
        <button onClick={this.cancelEdit}>Cancel</button>
      </div>
    </div>);
  }
}