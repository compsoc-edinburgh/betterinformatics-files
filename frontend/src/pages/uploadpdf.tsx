import * as React from "react";
import axios from 'axios';

interface Props {}

export default class UploadPDF extends React.Component<{}, {}> {

  file: HTMLInputElement | null = null;
  fileName: HTMLInputElement | null = null;

  constructor(props: Props) {
    super(props);
    this.handleUpload = this.handleUpload.bind(this);
  }

  handleUpload(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (this.file === null || this.file.files === null || this.fileName === null) {
      return;
    }
    const data = new FormData();
    data.append('file', this.file.files[0]);
    data.append('filename', this.fileName.value);
    axios.post('/api/uploadpdf', data)
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      })
  }

  render() {
    return (
      <div>
        <form onSubmit={this.handleUpload}>
          <input ref={(ref) => { this.file = ref }} type="file" />
          <input ref={(ref) => { this.fileName = ref }} type="text" placeholder="filename..." />
          <button type="submit">Upload</button>
        </form>
      </div>
    );
  }
};
