import {
  Alert,
  Col,
  Container,
  Row,
  Spinner,
  CardColumns,
} from "@vseth/components";
import React from "react";
import { useParams } from "react-router-dom";
import { useUser } from "../auth";
import UserAnswers from "../components/user-answers";
import UserNotifications from "../components/user-notifications";
import UserPayments from "../components/user-payments";
import UserScoreCard from "../components/user-score-card";
import { useUserInfo } from "../api/hooks";
import ContentContainer from "../components/secondary-container";
import useTitle from "../hooks/useTitle";
const UserPage: React.FC<{}> = () => {
  const { username } = useParams() as { username: string };
  useTitle(`${username} - VIS Community Solutions`);
  const user = useUser()!;
  const isMyself = user.username === username;
  const [userInfoError, userInfoLoading, userInfo] = useUserInfo(username);
  const error = userInfoError;
  const loading = userInfoLoading;
  return (
    <>
      <Container>
        <UserScoreCard
          username={username}
          isMyself={isMyself}
          userInfo={userInfo}
        />
        {error && <Alert color="danger">{error.toString()}</Alert>}
        {loading && <Spinner />}
      </Container>
      <ContentContainer>
        <Container>
          <Row>
            {(isMyself || user.isAdmin) && (
              <Col md={6}>
                <UserPayments username={username} />
              </Col>
            )}
            {isMyself && (
              <Col md={6}>
                <UserNotifications username={username} />
              </Col>
            )}
          </Row>

          <UserAnswers username={username} />
        </Container>
      </ContentContainer>
    </>
  );
};
export default UserPage;
