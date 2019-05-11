import * as React from "react";
import {fetchapi, fetchpost} from "../fetch-utils";
import {NotificationInfo, PaymentInfo, UserInfo} from "../interfaces";
import NotificationComponent from "../components/notification";
import AutocompleteInput from '../components/autocomplete-input';
import {css} from "glamor";
import {listenEnter} from "../input-utils";
import colors from "../colors";
import * as moment from "moment";
import GlobalConsts from "../globalconsts";
import {Link} from "react-router-dom";
import Colors from "../colors";

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
  twoRows: css({
    display: "flex",
    flexWrap: "wrap",
    flexDirection: "row-reverse",
  }),
  rowContent: css({
    marginRight: "50px",
    flexGrow: "1",
  }),
  notificationSettings: css({
    marginBottom: "40px",
  }),
  clickable: css({
    cursor: "pointer",
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
};

interface Props {
  isMyself: boolean;
  isAdmin: boolean;
  username: string;
}

interface State {
  userInfo: UserInfo;
  showAll: boolean;
  notifications: NotificationInfo[];
  payments: PaymentInfo[];
  openPayment: string;
  enabledNotifications: number[];
  categories: string[];
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
    showAll: false,
    notifications: [],
    payments: [],
    openPayment: "",
    enabledNotifications: [],
    categories: [],
    newPaymentCategory: "",
  };

  componentDidMount() {
    this.loadUserInfo();
    if (this.props.isMyself) {
      this.loadUnreadNotifications();
      this.loadEnabledNotifications();
      this.loadPayments();
    }
    if (this.props.isAdmin) {
      this.loadPayments();
      this.loadCategories();
    }
  }

  componentDidUpdate(prevProps: Props) {
    document.title = this.state.userInfo.displayName + " - VIS Community Solutions";
    if (!prevProps.isMyself && this.props.isMyself) {
      this.loadUnreadNotifications();
      this.loadEnabledNotifications();
      this.loadPayments();
    }
    if (!prevProps.isAdmin && this.props.isAdmin) {
      this.loadPayments();
      this.loadCategories();
    }
    if (prevProps.username !== this.props.username) {
      this.loadUserInfo();
      if (this.props.isAdmin) {
        this.loadPayments();
      }
    }
  }

  loadUserInfo = () => {
    fetchapi('/api/userinfo/' + this.props.username)
      .then(res => {
        this.setState({
          userInfo: res.value
        });
      })
      .catch(err => {
        this.setState({
          error: err.toString()
        });
      });
  };

  loadEnabledNotifications = () => {
    fetchapi('/api/notifications/getenabled')
      .then(res => {
        this.setState({
          enabledNotifications: res.value
        });
      })
      .catch(err => {
        this.setState({
          error: err.toString()
        });
      });
  };

  loadPayments = () => {
    const query = this.props.isMyself ? '/api/payment/me' : '/api/payment/query/' + this.props.username;
    fetchapi(query)
      .then(res => {
        this.setState({
          payments: res.value
        });
      })
      .catch(err => {
        this.setState({
          error: err.toString()
        });
      });
  };

  loadCategories = () => {
    fetchapi('/api/listcategories/onlypayment')
      .then(res => {
        this.setState({
          categories: res.value
        });
      })
      .catch(err => {
        this.setState({
          error: err.toString()
        });
      });
  };

  addPayment = () => {
    fetchpost('/api/payment/pay', {
      username: this.props.username,
      category: this.state.newPaymentCategory,
    })
      .then(() => {
        this.setState({
          newPaymentCategory: "",
        });
        this.loadPayments();
      })
      .catch(err => {
        this.setState({
          error: err.toString()
        });
      });
  };

  addPaymentAll = () => {
    fetchpost('/api/payment/payall', {
      username: this.props.username,
    })
      .then(() => {
        this.loadPayments();
      })
      .catch(err => {
        this.setState({
          error: err.toString()
        });
      });
  };

  removePayment = (payment: PaymentInfo) => {
    const confirmation = confirm("Remove Payment?");
    if (confirmation) {
      fetchpost('/api/payment/remove', {
        oid: payment.oid,
      })
        .then(() => {
          this.loadPayments();
        })
        .catch(err => {
          this.setState({
            error: err.toString()
          });
        });
    }
  };

  refundPayment = (payment: PaymentInfo) => {
    let confirmation = true;
    if (!payment.uploaded_filename) {
      confirmation = confirm("The payment does not have any associated exams. Really refund?");
    }
    if (confirmation) {
      fetchpost('/api/payment/refund', {
        oid: payment.oid,
      })
        .then(() => {
          this.loadPayments();
        })
        .catch(err => {
          this.setState({
            error: err.toString()
          });
        });
    }
  };

  loadUnreadNotifications = () => {
    fetchapi('/api/notifications/unread')
      .then(res => {
        this.setState({
          notifications: res.value
        });
      })
      .catch(err => {
        this.setState({
          error: err.toString()
        });
      });
  };

  loadAllNotifications = () => {
    fetchapi('/api/notifications/all')
      .then(res => {
        this.setState({
          showAll: true,
          notifications: res.value,
        });
      })
      .catch(err => {
        this.setState({
          error: err.toString()
        });
      });
  };

  setNotificationEnabled = (type: number, enabled: boolean) => {
    fetchpost('/api/notifications/setenabled', {
      type: type,
      enabled: enabled ? 1 : 0,
    })
      .then(() => {
        this.loadEnabledNotifications();
      });
  };

  markAllRead = () => {
    Promise.all(
      this.state.notifications
        .filter(notification => !notification.read)
        .map(notification =>
          fetchpost('/api/notifications/setread', {
            read: 1,
            notificationoid: notification.oid,
          })
            .catch(err => {
              this.setState({
                error: err.toString()
              });
            })
        )
    )
      .then(() => {
        if (this.state.showAll) {
          this.loadAllNotifications();
        } else {
          this.loadUnreadNotifications();
        }
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
        {this.state.error && <div>{this.state.error}</div>}
        <div {...styles.card}>
          <h1>{this.state.userInfo.displayName}</h1>
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
              <div {...styles.scoreNumber}>{this.state.userInfo.score_comments}</div>
            </div>
            {this.state.userInfo.score_cuts > 0 && <div {...styles.score}>
                <div>Exam Import</div>
                <div {...styles.scoreNumber}>{this.state.userInfo.score_cuts}</div>
            </div>}
            {this.state.userInfo.score_legacy > 0 && <div {...styles.score}>
                <div>Wiki Import</div>
                <div {...styles.scoreNumber}>{this.state.userInfo.score_legacy}</div>
            </div>}
          </div>
        </div>
        <div {...styles.twoRows}>
          {(this.state.payments.length > 0 || this.props.isAdmin) && <div {...styles.rowContent}>
            <h2>Paid Oral Exams</h2>
            <div>
              {this.state.payments
                .filter(payment => payment.category === "__payment_all__" && payment.active)
                .map(payment => <div key={payment.category}>
                  You have paid for all oral exams until {moment(payment.valid_until, GlobalConsts.momentParseString).format(GlobalConsts.momentFormatStringDate)}.
                </div>)}
              {this.state.payments.length > 0 && <ul>
                {this.state.payments.map(payment =>
                  <li key={payment.category}>{(this.state.openPayment === payment.oid) && <div {...styles.payment}>
                    <div {...styles.clickable} {...(payment.active ? undefined : styles.paymentInactive)} onClick={() => this.setState({openPayment: ""})}><b>{payment.category === "__payment_all__" ? "All Oral Exams" : payment.category}</b></div>
                    <div>
                      Payment Time: {moment(payment.payment_time, GlobalConsts.momentParseString).format(GlobalConsts.momentFormatString)}
                    </div>
                    <div>
                      Valid Until: {moment(payment.valid_until, GlobalConsts.momentParseString).format(GlobalConsts.momentFormatStringDate)}
                    </div>
                    {payment.refund_time && <div>
                        Refund Time: {moment(payment.refund_time, GlobalConsts.momentParseString).format(GlobalConsts.momentFormatString)}
                    </div>}
                    {payment.uploaded_filename && <div>
                        <Link to={"/exams/" + payment.uploaded_filename}>Uploaded Transcript</Link>
                    </div>}
                    {!payment.refund_time && this.props.isAdmin && <div>
                      <button onClick={() => this.refundPayment(payment)}>Mark Refunded</button>
                      <button onClick={() => this.removePayment(payment)}>Remove Payment</button>
                    </div>}
                  </div> || <span {...styles.clickable} {...(payment.active ? undefined : styles.paymentInactive)} onClick={() => this.setState({openPayment: payment.oid})}>{payment.category === "__payment_all__" ? "All Oral Exams" : payment.category}</span>}</li>
                )}
              </ul>}
              {this.props.isAdmin && <div>
                <AutocompleteInput value={this.state.newPaymentCategory} onChange={ev => this.setState({newPaymentCategory: ev.target.value})}
                                   placeholder="Category" autocomplete={this.state.categories} name="payment_category" onKeyPress={listenEnter(this.addPayment)}/>
                <button onClick={this.addPayment}>Add Payment</button>
              </div>}
              {this.props.isAdmin && <div>
                  <button onClick={this.addPaymentAll}>Add Payment for All Categories</button>
              </div>}
            </div>
          </div>}
          {this.props.isMyself && <div {...styles.rowContent}>
            <h2>Notifications</h2>
            <div {...styles.notificationSettings}>
                <div><input type="checkbox" checked={this.state.enabledNotifications.indexOf(1) !== -1} onChange={(ev) => this.setNotificationEnabled(1, ev.target.checked)}/> Comment to my answer</div>
                <div><input type="checkbox" checked={this.state.enabledNotifications.indexOf(2) !== -1} onChange={(ev) => this.setNotificationEnabled(2, ev.target.checked)}/> Comment to my comment</div>
                <div><input type="checkbox" checked={this.state.enabledNotifications.indexOf(3) !== -1} onChange={(ev) => this.setNotificationEnabled(3, ev.target.checked)}/> Other answer to same question</div>
            </div>
            {this.state.notifications.reverse().map(notification => (
              <NotificationComponent notification={notification} key={notification.oid}/>
            ))}
            <div>
              {(!this.state.showAll) && <button onClick={this.loadAllNotifications}>Show All Notifications</button>}
              {(this.state.notifications.filter(notification => !notification.read).length > 0) &&
              <button onClick={this.markAllRead}>Mark All Read</button>}
            </div>
          </div>}
        </div>
      </div>
    );
  }
};
