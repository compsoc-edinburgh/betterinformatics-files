import * as React from "react";
import {css} from "glamor";
import {fetchpost} from "../fetch-utils";
import {RefObject} from "react";

const styles = {
  background: css({
    background: "rgba(0, 0, 0, 0.4)",
    position: "fixed",
    top: "0",
    left: "0",
    right: "0",
    bottom: "0",
    paddingTop: "200px",
    paddingBottom: "200px",
  }),
  dialog: css({
    background: "#eeeeee",
    boxShadow: "0 4px 8px 0 grey",
    width: "70%",
    maxWidth: "1200px",
    height: "100%",
    margin: "auto",
  }),
  header: css({
    background: "#394b59",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: "20px",
  }),
  title: css({
    color: "#ffffff",
    fontSize: "20px",
    padding: "20px",
  }),
  content: css({
    padding: "20px",
    overflow: "auto",
    height: "calc(100% - 110px)"
  }),
  uploadForm: css({
    textAlign: "center",
  }),
  images: css({
    display: "flex",
    flexWrap: "wrap",
    height: "100%",
    marginTop: "20px",
  }),
  imageWrapper: css({
    width: "138px",
    height: "138px",
  }),
  imageSelected: css({
    background: "#aabbcc",
  }),
  imageSmallWrapper: css({
    width: "128px",
    height: "128px",
    margin: "5px",
  }),
  imageSmall: css({
    maxWidth: "128px",
    maxHeight: "128px",
  }),
  deleteImgWrapper: css({
    position: "relative",
    top: "-133px",
    left: "5px",
    height: "32px",
    width: "32px",
  }),
  deleteImg: css({
    height: "32px",
    width: "32px",
  }),
};

interface Props {
  onClose: (image: string) => void;
}

interface State {
  images: string[];
  file?: Blob;
  selected: string;
  error?: string;
}

export default class ImageOverlay extends React.Component<Props, State> {

  state: State = {
    images: [],
    selected: "",
  };

  fileInputRef: RefObject<HTMLInputElement> = React.createRef();

  async componentWillMount() {
    this.loadImages();
  }

  loadImages = () => {
    fetch('/api/image/list')
        .then(res => res.json())
        .then(res => {
          res.value.reverse();
          this.setState({images: res.value})
        })
      .catch((e) => {
        this.setState({error: e.toString()});
      });
  };

  cancelDialog = () => {
    this.props.onClose("");
  };

  chooseImage = () => {
    this.props.onClose(this.state.selected);
  };

  uploadImage = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    if (!this.state.file) {
      return;
    }

    fetchpost('/api/uploadimg', {
      file: this.state.file
    })
      .then(res => res.json())
      .then(res => {
        this.setState({
          selected: res.filename,
          file: undefined,
        });
        if (this.fileInputRef.current) {
          this.fileInputRef.current.value = "";
        }
        this.loadImages();
      })
      .catch(() => undefined);
  };

  handleFileChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    if (ev.target.files != null) {
      this.setState({
        file: ev.target.files[0]
      });
    }
  };

  onImageClick = (image: string) => {
    this.setState({
      selected: image
    });
  };

  removeImage = async (image: string) => {
    const confirmation = confirm("Remove image?");
    if (confirmation) {
      fetchpost(`/api/image/${image}/remove`, {})
        .then(() => {
          this.loadImages();
        })
        .catch(() => undefined);
    }
  };

  render() {
    return (<div {...styles.background}>
      <div {...styles.dialog}>
        <div {...styles.header}>
          <div {...styles.title}>Images</div>
          <div><button onClick={this.chooseImage}>Add</button> <button onClick={this.cancelDialog}>Cancel</button></div>
        </div>
        <div {...styles.content}>
          <div>
            <form {...styles.uploadForm} onSubmit={this.uploadImage}>
              <input onChange={this.handleFileChange} type="file" accept="image/*" ref={this.fileInputRef} />
              <button type="submit">Upload</button>
            </form>
          </div>
          {this.state.error && <div>{this.state.error}</div>}
          <div {...styles.images}>
            {this.state.images.map(img =>
                <div key={img} onClick={() => this.onImageClick(img)} {...styles.imageWrapper} {...(img === this.state.selected ? styles.imageSelected : undefined)}>
                  <div {...styles.imageSmallWrapper}>
                    <img {...styles.imageSmall} key={img} src={"/api/img/" + img} alt="Image Preview" />
                  </div>
                  <div {...styles.deleteImgWrapper} onClick={() => this.removeImage(img)}>
                    <img {...styles.deleteImg} src={"/static/delete.svg"} alt="Delete"/>
                  </div>
                </div>)}
          </div>
        </div>
      </div>
    </div>);
  }
}