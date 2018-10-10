import * as React from "react";
import { Redirect } from "react-router-dom";
import { fetchpost } from '../fetchutils';
import AutocompleteInput from '../components/autocomplete-input';

interface State {
  file: Blob;
  fileName: string;
  category: string;
  categories: string[];
  result?: { href: string };
  error?: string;
}

export default class UploadPDF extends React.Component<{}, State> {

  state: State = {
    file: new Blob(),
    fileName: "",
    category: "",
    categories: []
  };

  async componentWillMount() {
    try {
      const res = await (await fetch('/api/listcategories?exams=0')).json();
      this.setState({
        categories: res.value.map((category: { name: string }) => category.name)
      });
    } catch (e) {
      // TODO implement proper error handling
      console.log(e);
    }
  }

  async componentDidMount() {
    document.title = "VIS-Exchange: Upload Exam";
  }

  handleUpload = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    fetchpost('/api/uploadpdf', {
      file: this.state.file,
      filename: this.state.fileName + ".pdf",
      category: this.state.category
    })
    .then((response) => {
      if (response.ok) {
        response.json().then((res) => this.setState({
          result: res,
          error: undefined
        }));
      } else {
        response.json().then((res) => this.setState({
          error: res.err
        }));
      }
    })
    .catch((e) => {
      // TODO implement proper error handling
      console.log(e);
    });
  };

  handleFileChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    if (ev.target.files != null) {
      this.setState({
        file: ev.target.files[0]
      });
    }
  };

  handleFileNameChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      fileName: ev.target.value
    });
  };

  handleCategoryChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      category: ev.target.value
    })
  };

  render() {
    if (this.state.result) {
      return <Redirect to={this.state.result.href} />
    } else {
      return (
        <div>
          {this.state.error && <p>{ this.state.error }</p>}
          <form onSubmit={this.handleUpload}>
            <input onChange={this.handleFileChange} type="file" />
            <input onChange={this.handleFileNameChange} value={this.state.fileName} type="text" placeholder="filename..." />
            <AutocompleteInput name="category" onChange={this.handleCategoryChange} value={this.state.category} placeholder="category..." autocomplete={this.state.categories} />
            <button type="submit">Upload</button>
          </form>
        </div>
      );
    }
  }
};
