import * as React from "react";
import {css} from "glamor";
import {Attachment} from "../interfaces";

const styles = {
  wrapper: css({
  }),
};

interface Props {
  attachments: Attachment[];
  onAddAttachment: (attachment: Attachment) => void;
  onRemoveAttachment: (attachment: Attachment) => void;
};

interface State {
  newFile: Blob;
  newDisplayname: string;
};

export default class Attachments extends React.Component<Props, State> {
  state: State = {
    newFile: new Blob(),
    newDisplayname: "",
  };

  displaynameChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = event.target.value;
    this.setState({
      newDisplayname: newVal
    });
  };

  filechange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    if (ev.target.files != null) {
      this.setState({
        newFile: ev.target.files[0]
      });
    }
  };

  render() {
    const atts = this.props.attachments;
    return (<div {...styles.wrapper}>
      {atts.map(att => <div key={att.filename}>
        <a href={'/api/filestore/' + att.filename}>{att.displayname}</a>
      </div>)}
      <div>
        <input type="text" placeholder="displayname" title="displayname" value={this.state.newDisplayname} onChange={this.displaynameChanged} />
      </div>
      <div>
        <input type="file" title="attachment" onChange={this.filechange} />
      </div>
    </div>);
  }
}