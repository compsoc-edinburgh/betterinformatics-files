import * as React from "react";
import {css} from "glamor";
import Colors from "../colors";
import {fetchpost} from "../fetch-utils";

interface Props {
  title: string;
  filename: string;
  examtype: string;
}

interface State {
  printed: boolean;
  currentPassword: string;
  error?: string;
}

const styles = {
  wrapper: css({
    width: "430px",
    margin: "auto",
    marginBottom: "20px",
    padding: "10px",
    background: Colors.cardBackground,
    boxShadow: Colors.cardShadow,
    "@media (max-width: 699px)": {
      padding: "5px",
    },
  }),
  passwordWrapper: css({
    margin: "auto",
    width: "50%",
  }),
  passwordBox: css({
    width: "100%",
  }),
  printButton: css({
    width: "100%",
  })
};

export default class PrintExam extends React.Component<Props, State> {

  state: State = {
    printed: false,
    currentPassword: "",
  };

  printExam = () => {
    this.setState({
      error: ""
    });
    if (this.state.currentPassword.length > 0) {
      fetchpost('/api/printpdf/' + this.props.examtype + '/' + this.props.filename, {password: this.state.currentPassword})
        .then(() => {
          this.setState({
            printed: true
          });
        })
        .catch(err => {
          this.setState({
            error: err
          });
        });
    } else {
      this.setState({
        error: "Please enter a password."
      });
    }
  };

  render() {
    return (
      <div {...styles.wrapper}>
        <p>
          Unfortunately we can not provide you this {this.props.title} as a PDF. The corresponding professor did not allow this.
        </p>
        <p>
          Warning: The ETH Print Service may generate cost after a certain number of free pages.<br/>
          More Information: <a href="https://printing.sp.ethz.ch/ethps4s">https://printing.sp.ethz.ch/ethps4s</a>
        </p>
        {this.state.error && <p>{this.state.error}</p>}
        {!this.state.printed &&
          <div {...styles.passwordWrapper}>
            <label>
              Password <br/>
              <input {...styles.passwordBox} name="password" type="password"
                     onChange={(ev) => this.setState({currentPassword: ev.target.value})}
                     value={this.state.currentPassword}/>
            </label>
            <br/>
            <button {...styles.printButton} onClick={this.printExam}>Print {this.props.title}</button>
          </div> || (
          <p>Exam successfully printed</p>
        )
        }
      </div>
    );
  }
};
