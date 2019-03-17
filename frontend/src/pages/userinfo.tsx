import * as React from "react";
import {fetchapi} from "../fetch-utils";

interface Props {
  username: string;
}

interface State {
  displayName: string;
  score: number;
  error?: string;
}

export default class UserInfo extends React.Component<Props, State> {

  state: State = {
    displayName: "Loading...",
    score: 0,
  };

  async componentWillMount() {
    fetchapi('/api/userinfo/' + this.props.username)
      .then(res => res.json())
      .then(res => {
        this.setState({
          displayName: res.value.displayName,
          score: res.value.score,
        })
      })
  }

  render() {
    return (
      <div>
        {this.state.error && <p>{this.state.error}</p>}
        <h1>{this.state.displayName}</h1>
        <p>Score: {this.state.score}</p>
      </div>
    );
  }
};
