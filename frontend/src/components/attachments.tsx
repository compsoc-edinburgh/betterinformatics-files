import * as React from "react";
import { css } from "glamor";
import { Attachment } from "../interfaces";
import { fetchpost } from "../fetch-utils";

const stylesForWidth = {
  justWidth: css({
    width: "200px",
  }),
  inlineBlock: css({
    width: "200px",
    margin: "5px",
    display: "inline-block",
  }),
};
const styles = {
  wrapper: css({}),
};

interface Props {
  attachments: Attachment[];
  additionalArgs: object;
  onAddAttachment: (attachment: Attachment) => void;
  onRemoveAttachment: (attachment: Attachment) => void;
}

interface State {
  newFile: Blob;
  newDisplayname: string;
  error?: string;
}

export default class Attachments extends React.Component<Props, State> {
  state: State = {
    newFile: new Blob(),
    newDisplayname: "",
  };

  displaynameChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = event.target.value;
    this.setState({
      newDisplayname: newVal,
    });
  };

  filechange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    if (ev.target.files != null) {
      this.setState({
        newFile: ev.target.files[0],
      });
    }
  };

  uploadFile = () => {
    if (!this.state.newDisplayname) {
      return;
    }
    fetchpost("/api/filestore/upload/", {
      ...this.props.additionalArgs,
      displayname: this.state.newDisplayname,
      file: this.state.newFile,
    })
      .then(res => {
        const att: Attachment = {
          displayname: this.state.newDisplayname,
          filename: res.filename,
        };
        this.props.onAddAttachment(att);
        this.setState({
          newDisplayname: "",
          newFile: new Blob(),
          error: "",
        });
      })
      .catch(res => {
        this.setState({
          error: res,
        });
      });
  };

  removeFile = (att: Attachment) => {
    fetchpost("/api/filestore/remove/" + att.filename + "/", {}).then(res => {
      this.props.onRemoveAttachment(att);
    });
  };

  render() {
    const atts = this.props.attachments;
    return (
      <div {...styles.wrapper}>
        {atts.map(att => (
          <div key={att.filename}>
            <a
              {...stylesForWidth.inlineBlock}
              href={"/api/filestore/get/" + att.filename + "/"}
              target="_blank"
            >
              {att.displayname}
            </a>
            <button onClick={ev => this.removeFile(att)}>Remove File</button>
          </div>
        ))}
        <div>
          <label>
            Upload new attachment
            <input
              type="text"
              placeholder="displayname"
              title="displayname"
              value={this.state.newDisplayname}
              onChange={this.displaynameChanged}
            />
          </label>
        </div>
        <div>
          <label>
            <input type="file" title="attachment" onChange={this.filechange} />
          </label>
          <button onClick={this.uploadFile}>Upload</button>
        </div>
        {this.state.error && <div>{this.state.error}</div>}
      </div>
    );
  }
}
