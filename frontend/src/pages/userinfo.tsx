import * as React from "react";
import { fetchapi, fetchpost } from "../fetch-utils";
import { Answer, NotificationInfo, PaymentInfo, UserInfo } from "../interfaces";
import NotificationComponent from "../components/notification";
import { css } from "glamor";
import colors from "../colors";
import moment from "moment";
import GlobalConsts from "../globalconsts";
import { Link } from "react-router-dom";
import Colors from "../colors";
import AnswerComponent from "../components/answer";

const styles = {
  wrapper: css({
    maxWidth: "1200px",
    margin: "auto",
  }),
  scoreWrapper: css({
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-around",
    marginTop: "40px",
    marginBottom: "20px",
  }),
  card: css({
    background: Colors.cardBackground,
    boxShadow: Colors.cardShadow,
    padding: "15px 40px",
    marginTop: "40px",
    marginBottom: "80px",
  }),
  score: css({
    minWidth: "140px",
    textAlign: "center",
    fontSize: "20px",
  }),
  scoreNumber: css({
    fontSize: "72px",
  }),
  multiRows: css({
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
  }),
  rowContent: css({
    width: "100%",
    boxSizing: "border-box",
    paddingLeft: "20px",
    paddingRight: "20px",
    flexGrow: "1",
    "@media (min-width: 799px)": {
      width: "50%",
    },
  }),
  notificationSettings: css({
    marginBottom: "40px",
  }),
  clickable: css({
    cursor: "pointer",
  }),
  paymentWrapper: css({
    marginLeft: "20px",
    marginRight: "20px",
    marginBottom: "40px",
  }),
  payment: css({
    background: colors.cardBackground,
    boxShadow: colors.cardShadow,
    padding: "5px",
    maxWidth: "300px",
  }),
  paymentInactive: css({
    color: colors.inactiveElement,
  }),
  logoutText: css({
    marginLeft: "10px",
    cursor: "pointer",
    fontSize: "medium",
  }),
};

interface Props {
  isMyself: boolean;
  isAdmin: boolean;
  username: string;
  userinfoChanged: () => void;
}

interface State {
  userInfo: UserInfo;
  showAllNotifications: boolean;
  showReadNotifications: boolean;
  showAllAnswers: boolean;
  notifications: NotificationInfo[];
  payments: PaymentInfo[];
  answers: Answer[];
  openPayment: string;
  enabledNotifications: number[];
  newPaymentCategory: string;
  error?: string;
}

export default class UserInfoComponent extends React.Component<Props, State> {
  state: State = {
    userInfo: {
      username: this.props.username,
      displayName: "Loading...",
      score: 0,
      score_answers: 0,
      score_comments: 0,
      score_cuts: 0,
      score_legacy: 0,
    },
    showAllNotifications: false,
    showReadNotifications: false,
    showAllAnswers: false,
    notifications: [],
    payments: [],
    answers: [],
    openPayment: "",
    enabledNotifications: [],
    newPaymentCategory: "",
  };

  componentDidMount() {
    this.loadUserInfo();
    this.loadAnswers();
    if (this.props.isMyself) {
      this.loadUnreadNotifications();
      this.loadEnabledNotifications();
      this.loadPayments();
    }
    if (this.props.isAdmin) {
      this.loadPayments();
    }
  }

  componentDidUpdate(prevProps: Props) {
    document.title =
      this.state.userInfo.displayName + " - VIS Community Solutions";
    if (!prevProps.isMyself && this.props.isMyself) {
      this.loadUnreadNotifications();
      this.loadEnabledNotifications();
      this.loadPayments();
    }
    if (!prevProps.isAdmin && this.props.isAdmin) {
      this.loadPayments();
    }
    if (prevProps.username !== this.props.username) {
      this.loadUserInfo();
      this.loadAnswers();
      if (this.props.isAdmin) {
        this.loadPayments();
      }
    }
  }

  loadUserInfo = () => {
    fetchapi("/api/scoreboard/userinfo/" + this.props.username + "/")
      .then(res => {
        this.setState({
          userInfo: res.value,
        });
      })
      .catch(err => {
        this.setState({
          error: err.toString(),
        });
      });
  };

  loadEnabledNotifications = () => {
    fetchapi("/api/notification/getenabled/")
      .then(res => {
        this.setState({
          enabledNotifications: res.value,
        });
      })
      .catch(err => {
        this.setState({
          error: err.toString(),
        });
      });
  };

  loadPayments = () => {
    const query = this.props.isMyself
      ? "/api/payment/me/"
      : "/api/payment/query/" + this.props.username + "/";
    fetchapi(query)
      .then(res => {
        this.setState({
          payments: res.value,
        });
      })
      .catch(err => {
        this.setState({
          error: err.toString(),
        });
      });
  };

  addPayment = () => {
    fetchpost("/api/payment/pay/", {
      username: this.props.username,
    })
      .then(() => {
        this.loadPayments();
      })
      .catch(err => {
        this.setState({
          error: err.toString(),
        });
      });
  };

  removePayment = (payment: PaymentInfo) => {
    // eslint-disable-next-line no-restricted-globals
    const confirmation = confirm("Remove Payment?");
    if (confirmation) {
      fetchpost("/api/payment/remove/" + payment.oid + "/", {})
        .then(() => {
          this.loadPayments();
        })
        .catch(err => {
          this.setState({
            error: err.toString(),
          });
        });
    }
  };

  refundPayment = (payment: PaymentInfo) => {
    let confirmation = true;
    if (!payment.uploaded_filename) {
      // eslint-disable-next-line no-restricted-globals
      confirmation = confirm(
        "The payment does not have any associated exams. Really refund?",
      );
    }
    if (confirmation) {
      fetchpost("/api/payment/refund/" + payment.oid + "/", {})
        .then(() => {
          this.loadPayments();
        })
        .catch(err => {
          this.setState({
            error: err.toString(),
          });
        });
    }
  };

  loadUnreadNotifications = () => {
    fetchapi("/api/notification/unread/")
      .then(res => {
        this.setState({
          notifications: res.value,
        });
      })
      .catch(err => {
        this.setState({
          error: err.toString(),
        });
      });
  };

  loadAllNotifications = () => {
    fetchapi("/api/notification/all/")
      .then(res => {
        this.setState({
          showReadNotifications: true,
          notifications: res.value,
        });
      })
      .catch(err => {
        this.setState({
          error: err.toString(),
        });
      });
  };

  setNotificationEnabled = (type: number, enabled: boolean) => {
    fetchpost("/api/notification/setenabled/", {
      type: type,
      enabled: enabled,
    }).then(() => {
      this.loadEnabledNotifications();
    });
  };

  markAllRead = () => {
    Promise.all(
      this.state.notifications
        .filter(notification => !notification.read)
        .map(notification =>
          fetchpost("/api/notification/setread/" + notification.oid + "/", {
            read: true,
          }).catch(err => {
            this.setState({
              error: err.toString(),
            });
          }),
        ),
    )
      .then(() => {
        if (this.state.showReadNotifications) {
          this.loadAllNotifications();
        } else {
          this.loadUnreadNotifications();
        }
      })
      .catch(err => {
        this.setState({
          error: err.toString(),
        });
      });
  };

  loadAnswers = () => {
    fetchapi("/api/exam/listbyuser/" + this.props.username + "/")
      .then(res => {
        this.setState({
          answers: res.value,
        });
      })
      .catch(err => {
        this.setState({
          error: err.toString(),
        });
      });
  };

  logoutUser = () => {
    fetchpost("/api/auth/logout/", {}).then(() => {
      this.props.userinfoChanged();
    });
  };

  renderScoreCard = () => (
    <div {...styles.card}>
      <h1>
        {this.state.userInfo.displayName}
        {this.props.isMyself && (
          <span onClick={this.logoutUser} {...styles.logoutText}>
            (Logout)
          </span>
        )}
      </h1>
      <div {...styles.scoreWrapper}>
        <div {...styles.score}>
          <div>Score</div>
          <div {...styles.scoreNumber}>{this.state.userInfo.score}</div>
        </div>
        <div {...styles.score}>
          <div>Answers</div>
          <div {...styles.scoreNumber}>{this.state.userInfo.score_answers}</div>
        </div>
        <div {...styles.score}>
          <div>Comments</div>
          <div {...styles.scoreNumber}>
            {this.state.userInfo.score_comments}
          </div>
        </div>
        {this.state.userInfo.score_cuts > 0 && (
          <div {...styles.score}>
            <div>Exam Import</div>
            <div {...styles.scoreNumber}>{this.state.userInfo.score_cuts}</div>
          </div>
        )}
        {this.state.userInfo.score_legacy > 0 && (
          <div {...styles.score}>
            <div>Wiki Import</div>
            <div {...styles.scoreNumber}>
              {this.state.userInfo.score_legacy}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  renderPayments = () => (
    <div {...styles.paymentWrapper}>
      <h2>Paid Oral Exams</h2>
      <div>
        {this.state.payments
          .filter(payment => payment.active)
          .map(payment => (
            <div key={payment.oid}>
              You have paid for all oral exams until{" "}
              {moment(
                payment.valid_until,
                GlobalConsts.momentParseString,
              ).format(GlobalConsts.momentFormatStringDate)}
              .
            </div>
          ))}
        {this.state.payments.length > 0 && (
          <ul>
            {this.state.payments.map(payment => (
              <li key={payment.oid}>
                {(this.state.openPayment === payment.oid && (
                  <div {...styles.payment}>
                    <div
                      {...styles.clickable}
                      {...(payment.active ? undefined : styles.paymentInactive)}
                      onClick={() => this.setState({ openPayment: "" })}
                    >
                      <b>
                        Payment Time:{" "}
                        {moment(
                          payment.payment_time,
                          GlobalConsts.momentParseString,
                        ).format(GlobalConsts.momentFormatString)}
                      </b>
                    </div>
                    <div>
                      Valid Until:{" "}
                      {moment(
                        payment.valid_until,
                        GlobalConsts.momentParseString,
                      ).format(GlobalConsts.momentFormatStringDate)}
                    </div>
                    {payment.refund_time && (
                      <div>
                        Refund Time:{" "}
                        {moment(
                          payment.refund_time,
                          GlobalConsts.momentParseString,
                        ).format(GlobalConsts.momentFormatString)}
                      </div>
                    )}
                    {payment.uploaded_filename && (
                      <div>
                        <Link to={"/exams/" + payment.uploaded_filename}>
                          Uploaded Transcript
                        </Link>
                      </div>
                    )}
                    {!payment.refund_time && this.props.isAdmin && (
                      <div>
                        <button onClick={() => this.refundPayment(payment)}>
                          Mark Refunded
                        </button>
                        <button onClick={() => this.removePayment(payment)}>
                          Remove Payment
                        </button>
                      </div>
                    )}
                  </div>
                )) || (
                  <span
                    {...styles.clickable}
                    {...(payment.active ? undefined : styles.paymentInactive)}
                    onClick={() => this.setState({ openPayment: payment.oid })}
                  >
                    Payment Time:{" "}
                    {moment(
                      payment.payment_time,
                      GlobalConsts.momentParseString,
                    ).format(GlobalConsts.momentFormatString)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        {this.props.isAdmin &&
          this.state.payments.filter(payment => payment.active).length ===
            0 && (
            <div>
              <button onClick={this.addPayment}>Add Payment</button>
            </div>
          )}
      </div>
    </div>
  );

  renderNotifications = () => {
    let notifications = this.state.notifications.slice().reverse();
    if (!this.state.showAllNotifications && notifications.length > 5) {
      notifications = notifications.slice(0, 5);
    }
    return (
      <div {...styles.rowContent}>
        <h2>Notifications</h2>
        <div {...styles.notificationSettings}>
          <div>
            <input
              type="checkbox"
              checked={this.state.enabledNotifications.indexOf(1) !== -1}
              onChange={ev => this.setNotificationEnabled(1, ev.target.checked)}
            />{" "}
            Comment to my answer
          </div>
          <div>
            <input
              type="checkbox"
              checked={this.state.enabledNotifications.indexOf(2) !== -1}
              onChange={ev => this.setNotificationEnabled(2, ev.target.checked)}
            />{" "}
            Comment to my comment
          </div>
          <div>
            <input
              type="checkbox"
              checked={this.state.enabledNotifications.indexOf(3) !== -1}
              onChange={ev => this.setNotificationEnabled(3, ev.target.checked)}
            />{" "}
            Other answer to same question
          </div>
        </div>
        {notifications.map(notification => (
          <NotificationComponent
            notification={notification}
            key={notification.oid}
          />
        ))}
        <div>
          {notifications.length < this.state.notifications.length && (
            <button
              onClick={() => this.setState({ showAllNotifications: true })}
            >
              Show {this.state.notifications.length - notifications.length} More
              Notifications
            </button>
          )}
          {!this.state.showReadNotifications && (
            <button onClick={this.loadAllNotifications}>
              Show Read Notifications
            </button>
          )}
          {this.state.notifications.filter(notification => !notification.read)
            .length > 0 && (
            <button onClick={this.markAllRead}>Mark All Read</button>
          )}
        </div>
      </div>
    );
  };

  renderAnswers = () => {
    let answers = this.state.answers;
    if (!this.state.showAllAnswers && answers.length > 5) {
      answers = answers.slice(0, 5);
    }
    return (
      <div {...styles.rowContent}>
        <h2>Answers</h2>
        <div>
          {answers.length < this.state.answers.length && (
            <button onClick={() => this.setState({ showAllAnswers: true })}>
              Show {this.state.answers.length - answers.length} More Answers
            </button>
          )}
          {answers.length === 0 && (
            <span>This user did not write any answers yet.</span>
          )}
        </div>
      </div>
    );
  };

  render() {
    return (
      <div {...styles.wrapper}>
        {this.state.error && <div>{this.state.error}</div>}
        {this.renderScoreCard()}
        {(this.state.payments.length > 0 || this.props.isAdmin) &&
          this.renderPayments()}
        <div {...styles.multiRows}>
          {this.renderAnswers()}
          {this.props.isMyself && this.renderNotifications()}
        </div>
      </div>
    );
  }
}
