import * as React from "react";
import { fetchpost } from '../fetchutils';

export default class UploadPDF extends React.Component {

  file: Blob;
  fileName: string;

  handleUpload = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const data = new FormData();
    data.append('file', this.file);
    data.append('filename', this.fileName);

    fetchpost('/api/uploadpdf', {
      file: this.file,
      filename: this.fileName
    }).then((res) => {
      console.log(res);
    }).catch((err) => {
      console.log(err);
    });
  };

  handleFileChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    if (ev.target.files != null) {
      this.file = ev.target.files[0];
    }
  };

  handleFileNameChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    this.fileName = ev.target.value;
  };

  render() {
    return (
      <div>
        <form onSubmit={this.handleUpload}>
          <input onChange={this.handleFileChange} type="file" />
          <input onChange={this.handleFileNameChange} type="text" placeholder="filename..." />
          <button type="submit">Upload</button>
        </form>
      </div>
    );
  }
};
