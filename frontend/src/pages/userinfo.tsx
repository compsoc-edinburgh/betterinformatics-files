import { Alert, Col, Container, Row, Spinner } from "@vseth/components";
import React from "react";
import { useParams } from "react-router-dom";
import { useUser } from "../auth";
import UserAnswers from "../components/user-answers";
import UserNotifications from "../components/user-notifications";
import UserPayments from "../components/user-payments";
import UserScoreCard from "../components/user-score-card";
import { useUserInfo } from "../hooks/api";
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
        <Col sm={{ size: 12, order: 1 }} md={{ size: 6, order: 0 }}>
          <UserAnswers username={username} />
        </Col>
        {isMyself && (
          <Col sm={{ size: 12, order: 0 }} md={{ size: 6, order: 1 }}>
            <UserNotifications username={username} />
          </Col>
        )}
      </Row>
    </Container>
  );
};
export default UserPage;
