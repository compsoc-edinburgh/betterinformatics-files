import * as React from "react";
import {Link} from "react-router-dom";
import ExamList from "../components/exam-list"
import {css} from "glamor";

const styles = {
  wrapper: css({
    display: "flex",
    justifyContent: "space-between"
  }),
  admin: css({
    marginLeft: "10px",
    paddingLeft: "10px",
    paddingRight: "10px",
    "& button": {
      marginBottom: "10px",
      fontSize: "14px",
      width: "100%"
    }
  }),
  examlist: css({
    flexGrow: "1"
  })
};

interface Props {
  isAdmin?: boolean;
  isCategoryAdmin?: boolean;
}

export default class Home extends React.Component<Props> {

  async componentDidMount() {
    document.title = "VIS Community Solutions";
  }

  render() {
    return (
      <div {...styles.wrapper}>
        <div {...styles.examlist}>
          <ExamList hideDefaultCategory={!this.props.isAdmin}/>
        </div>
        {this.props.isCategoryAdmin &&
        <div {...styles.admin}>
          <h1>Admin</h1>
          <div><Link to="/uploadpdf">
            <button>Upload New Exam</button>
          </Link></div>
          {this.props.isAdmin &&
          <div><Link to="/categorize">
            <button>Category Editor</button>
          </Link></div>}
        </div>
        }
      </div>
    );
  }
};
