import * as React from "react";
import {css} from "glamor";
import {UserInfo} from "../interfaces";
import {fetchapi} from "../fetch-utils";
import {Link} from "react-router-dom";
import globalcss from "../globalcss";

const styles = {
  wrapper: css({
    maxWidth: "900px",
    margin: "auto",
  }),
  canClick: css({
    cursor: "pointer",
  }),
};

interface Props {
  username: string;
}

interface State {
  scoreboard: UserInfo[];
  error?: string;
}

export default class Scoreboard extends React.Component<Props, State> {

  state: State = {
    scoreboard: []
  };

  componentDidMount() {
    const hash = window.location.hash.substr(1);
    if (["score", "score_answers", "score_comments", "score_cuts", "score_legacy"].indexOf(hash) !== -1) {
      this.loadScoreboard(hash);
    } else {
      this.loadScoreboard("score");
    }
  }

  loadScoreboard = (scoretype: string) => {
    window.location.hash = scoretype;
    fetchapi('/api/scoreboard/' + scoretype)
      .then(res => {
        this.setState({
          scoreboard: res.value
        });
      })
      .catch(err => {
        this.setState({
          error: err.toString()
        });
      });
  };

  render() {
    return (
      <div {...styles.wrapper}>
        {this.state.error && <p>{this.state.error}</p>}
        <h1>Scoreboard</h1>
        <table>
          <thead>
          <tr>
            <th>Rank</th>
            <th>User</th>
            <th {...styles.canClick} onClick={() => this.loadScoreboard("score")}>Score</th>
            <th {...styles.canClick} onClick={() => this.loadScoreboard("score_answers")}>Answers</th>
            <th {...styles.canClick} onClick={() => this.loadScoreboard("score_comments")}>Comments</th>
            <th {...styles.canClick} onClick={() => this.loadScoreboard("score_cuts")}>Import Exams</th>
            <th {...styles.canClick} onClick={() => this.loadScoreboard("score_legacy")}>Import Wiki</th>
          </tr>
          </thead>
          <tbody>
          {this.state.scoreboard.map((board, idx) => <tr key={board.username}>
            <td>{idx+1}</td>
            <td {...globalcss.noLinkColor}><Link to={'/user/' + board.username}>{board.displayName}</Link></td>
            <td>{board.score}</td>
            <td>{board.score_answers}</td>
            <td>{board.score_comments}</td>
            <td>{board.score_cuts}</td>
            <td>{board.score_legacy}</td>
          </tr>)}
          </tbody>
        </table>
      </div>
    );
  }
};
