import * as React from "react";
import { css } from "glamor";
import { fetchPost } from "../api/fetch-utils";

interface Props {
  userinfoChanged: () => void;
}

interface State {
  username: string;
  password: string;
  error: string;
}

const styles = {
  wrapper: css({
    maxWidth: "300px",
    margin: "auto",
  }),
  form: css({
    marginTop: "100px",
    "& input": {
      width: "100%",
    },
    "& button": {
      width: "100%",
    },
  }),
};

export default class LoginForm extends React.Component<Props> {
  state: State = {
    username: "",
    password: "",
    error: "",
  };

  loginUser = (ev: React.MouseEvent<HTMLElement>) => {
    ev.preventDefault();

    const data = {
      username: this.state.username,
      password: this.state.password,
      simulate_nonadmin: ev.shiftKey ? "true" : "false",
    };

    fetchPost("/api/auth/login/", data)
      .then(() => {
        this.props.userinfoChanged();
      })
      .catch(err => {
        this.setState({
          error: err.toString(),
        });
      });
  };

  render() {
    return (
      <div {...styles.wrapper}>
        {this.state.error && <div>{this.state.error}</div>}
        <form {...styles.form}>
          <div>
            <input
              onChange={ev => this.setState({ username: ev.target.value })}
              value={this.state.username}
              type="text"
              placeholder="username"
              autoFocus={true}
              required
            />
          </div>
          <div>
            <input
              onChange={ev => this.setState({ password: ev.target.value })}
              value={this.state.password}
              type="password"
              placeholder="password"
              required
            />
          </div>
          <div>
            <button type="submit" onClick={this.loginUser}>
              Login
            </button>
          </div>
        </form>
        {window.location.hostname === "localhost" && (
          <div>
            <p>
              <b>Possible Debug Logins</b>
            </p>
            <p>schneij : UOmtnC7{"{"}'%G</p>
            <p>fletchz : 123456abc</p>
            <p>morica : admin666</p>
          </div>
        )}
      </div>
    );
  }
}
