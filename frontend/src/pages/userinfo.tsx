import { useParams, useHistory, Link } from "react-router-dom";
import { useUser, useSetUser, notLoggedIn } from "../auth";
import {
  useUserInfo,
  useLogout,
  usePayments,
  useRefundPayment,
  useRemovePayment,
  useAddPayments,
  useUserAnswers,
  useNotifications,
  useEnabledNotifications,
  useSetEnabledNotifications,
} from "../hooks/api";
import { UserInfo, PaymentInfo } from "../interfaces";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Spinner,
  Alert,
  Container,
  Row,
  Col,
  ListGroup,
  ListGroupItem,
  Form,
  FormGroup,
  Input,
  Label,
} from "@vseth/components";

import React, { useState } from "react";
import TwoButtons from "../components/two-buttons";
import Grid from "../components/grid";
import moment from "moment";
import GlobalConsts from "../globalconsts";
import AnswerComponent from "../components/answer";
import NotificationComponent from "../components/notification";

interface UserAnswersProps {
  username: string;
}
const UserAnswers: React.FC<UserAnswersProps> = ({ username }) => {
  const [error, loading, answers, reload] = useUserAnswers(username);
  return (
    <>
      <h2>Answers</h2>
      {error && <Alert color="danger">{error.message}</Alert>}
      {loading && <Spinner />}
      {answers &&
        answers.map(answer => (
          <AnswerComponent
            key={answer.oid}
            answer={answer}
            isLegacyAnswer={answer.isLegacyAnswer}
            onSectionChanged={reload}
          />
        ))}
    </>
  );
};

interface UserPaymentsProps {
  username: string;
}
const UserPayments: React.FC<UserPaymentsProps> = ({ username }) => {
  const user = useUser()!;
  const isAdmin = user.isAdmin;
  const isMyself = username === user.username;
  const [
    paymentsError,
    paymentsLoading,
    payments,
    reloadPayments,
  ] = usePayments(username, isMyself);
  const [refundError, refundLoading, refund] = useRefundPayment(reloadPayments);
  const [removeError, removeLoading, remove] = useRemovePayment(reloadPayments);
  const [addError, addLoading, add] = useAddPayments(reloadPayments);
  const error = paymentsError || refundError || removeError || addError;
  const loading =
    paymentsLoading || refundLoading || removeLoading || addLoading;
  const [openPayment, setOpenPayment] = useState("");
  return (
    <>
      {error && <Alert color="danger">{error.toString()}</Alert>}
      {loading && <Spinner />}
      {payments && (payments.length > 0 || isAdmin) && (
        <>
          <h2>Paid Oral Exams</h2>
          {payments
            .filter(payment => payment.active)
            .map(payment => (
              <Alert key={payment.oid}>
                You have paid for all oral exams until{" "}
                {moment(
                  payment.valid_until,
                  GlobalConsts.momentParseString,
                ).format(GlobalConsts.momentFormatStringDate)}
                .
              </Alert>
            ))}
          <Grid>
            {payments.map(payment =>
              openPayment === payment.oid ? (
                <ListGroup key={payment.oid} onClick={() => setOpenPayment("")}>
                  <ListGroupItem>
                    Payment Time:{" "}
                    {moment(
                      payment.payment_time,
                      GlobalConsts.momentParseString,
                    ).format(GlobalConsts.momentFormatString)}
                  </ListGroupItem>
                  <ListGroupItem>
                    Valid Until:{" "}
                    {moment(
                      payment.valid_until,
                      GlobalConsts.momentParseString,
                    ).format(GlobalConsts.momentFormatStringDate)}
                  </ListGroupItem>
                  {payment.refund_time && (
                    <ListGroupItem>
                      Refund Time:{" "}
                      {moment(
                        payment.refund_time,
                        GlobalConsts.momentParseString,
                      ).format(GlobalConsts.momentFormatString)}
                    </ListGroupItem>
                  )}
                  {payment.uploaded_filename && (
                    <ListGroupItem>
                      <Link to={"/exams/" + payment.uploaded_filename}>
                        Uploaded Transcript
                      </Link>
                    </ListGroupItem>
                  )}
                  {!payment.refund_time && isAdmin && (
                    <ListGroupItem>
                      <Button onClick={() => refund(payment.oid)}>
                        Mark Refunded
                      </Button>
                      <Button onClick={() => remove(payment.oid)}>
                        Remove Payment
                      </Button>
                    </ListGroupItem>
                  )}
                </ListGroup>
              ) : (
                <ListGroup
                  key={payment.oid}
                  onClick={() => setOpenPayment(payment.oid)}
                >
                  <ListGroupItem>
                    Payment Time:{" "}
                    {moment(
                      payment.payment_time,
                      GlobalConsts.momentParseString,
                    ).format(GlobalConsts.momentFormatString)}
                  </ListGroupItem>
                </ListGroup>
              ),
            )}
          </Grid>
        </>
      )}
      {isAdmin &&
        payments &&
        payments.filter(payment => payment.active).length === 0 && (
          <Container fluid>
            <Button onClick={() => add(username)}>Add Payment</Button>
          </Container>
        )}
    </>
  );
};

interface UserScoreCardProps {
  username?: string;
  userInfo?: UserInfo;
  isMyself: boolean;
}
const UserScoreCard: React.FC<UserScoreCardProps> = ({
  username,
  userInfo,
  isMyself,
}) => {
  const setUser = useSetUser();
  const [logoutError, logoutLoading, logout] = useLogout(() =>
    setUser(notLoggedIn),
  );
  return (
    <Card>
      {logoutError && <Alert color="danger">{logoutError.message}</Alert>}
      <CardHeader tag="h2">
        <TwoButtons
          left={userInfo?.displayName || username}
          right={
            isMyself && (
              <Button disabled={logoutLoading} onClick={logout}>
                Logout
              </Button>
            )
          }
        />
      </CardHeader>
      <CardBody>
        {userInfo ? (
          <>
            <Container fluid>
              <Row>
                <Col xs={12} md={6} lg={3}>
                  <Card>
                    <CardHeader tag="h4">Answers</CardHeader>
                    <CardBody tag="h5">{userInfo.score_answers}</CardBody>
                  </Card>
                </Col>
                <Col xs={12} md={6} lg={3}>
                  <Card>
                    <CardHeader tag="h4">Answers</CardHeader>
                    <CardBody tag="h5">{userInfo.score_answers}</CardBody>
                  </Card>
                </Col>
                <Col xs={12} md={6} lg={3}>
                  <Card>
                    <CardHeader tag="h4">Comments</CardHeader>
                    <CardBody tag="h5">{userInfo.score_comments}</CardBody>
                  </Card>
                </Col>
                {userInfo.score_cuts > 0 && (
                  <Col xs={12} md={6} lg={3}>
                    <Card>
                      <CardHeader tag="h4">Exam Import</CardHeader>
                      <CardBody tag="h5">{userInfo.score_cuts}</CardBody>
                    </Card>
                  </Col>
                )}
                {userInfo.score_legacy > 0 && (
                  <Col xs={12} md={6} lg={3}>
                    <Card>
                      <CardHeader tag="h4">Wiki Import</CardHeader>
                      <CardBody tag="h5">{userInfo.score_legacy}</CardBody>
                    </Card>
                  </Col>
                )}
              </Row>
            </Container>
          </>
        ) : (
          <Spinner />
        )}
      </CardBody>
    </Card>
  );
};
interface UserNotificationsProps {
  username: string;
}
const UserNotifications: React.FC<UserNotificationsProps> = ({ username }) => {
  const user = useUser()!;
  const isMyself = username === user.username;
  const [showRead, setShowRead] = useState(false);
  const [
    notificationsError,
    notificationsLoading,
    notifications,
  ] = useNotifications(showRead ? "all" : "unread");
  const [
    enabledError,
    enabledLoading,
    enabled,
    reloadEnabled,
  ] = useEnabledNotifications(isMyself);
  const [
    setEnabledError,
    setEnabledLoading,
    setEnabled,
  ] = useSetEnabledNotifications(reloadEnabled);
  const error = notificationsError || enabledError || setEnabledError;
  const checkboxLoading = enabledLoading || setEnabledLoading;

  return (
    <>
      <h2>Notifications</h2>
      {error && <Alert color="danger">{error.toString()}</Alert>}
      <FormGroup check>
        <Label>
          <input
            type="checkbox"
            checked={enabled && enabled.has(1)}
            disabled={checkboxLoading}
            onChange={e => setEnabled(1, e.currentTarget.checked)}
          />{" "}
          Comment to my answer
        </Label>
      </FormGroup>
      <FormGroup check>
        <Label>
          <input
            type="checkbox"
            checked={enabled && enabled.has(2)}
            disabled={checkboxLoading}
            onChange={e => setEnabled(2, e.currentTarget.checked)}
          />{" "}
          Comment to my comment
        </Label>
      </FormGroup>
      <FormGroup check>
        <Label>
          <input
            type="checkbox"
            checked={enabled && enabled.has(3)}
            disabled={checkboxLoading}
            onChange={e => setEnabled(3, e.currentTarget.checked)}
          />{" "}
          Other answer to same question
        </Label>
      </FormGroup>
      {notificationsLoading && <Spinner />}
      {notifications &&
        notifications.map(notification => (
          <NotificationComponent
            notification={notification}
            key={notification.oid}
          />
        ))}
    </>
  );
};

const UserPage: React.FC<{}> = () => {
  const { username } = useParams() as { username: string };
  const user = useUser()!;
  const isMyself = user.username === username;
  const [userInfoError, userInfoLoading, userInfo] = useUserInfo(username);
  const error = userInfoError;
  const loading = userInfoLoading;
  return (
    <Container>
      <UserScoreCard
        username={username}
        isMyself={isMyself}
        userInfo={userInfo}
      />
      {error && <Alert color="danger">{error.toString()}</Alert>}
      {loading && <Spinner />}
      <UserPayments username={username} />
      <Row>
        <Col md={6}>
          <UserAnswers username={username} />
        </Col>
        <Col md={6}>
          <UserNotifications username={username} />
        </Col>
      </Row>
    </Container>
  );
};
export default UserPage;
