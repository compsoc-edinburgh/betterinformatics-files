import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Row,
  Spinner,
} from "@vseth/components";
import React from "react";
import { notLoggedIn, useSetUser } from "../auth";
import { useLogout } from "../hooks/api";
import { UserInfo } from "../interfaces";
import TwoButtons from "./two-buttons";

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
    <>
      {logoutError && <Alert color="danger">{logoutError.message}</Alert>}
      <TwoButtons
        left={<h1>{userInfo?.displayName || username}</h1>}
        right={
          isMyself && (
            <Button disabled={logoutLoading} onClick={logout}>
              Logout
            </Button>
          )
        }
      />
      {userInfo ? (
        <>
          <Container fluid>
            <Row>
              <Col xs={12} md={6}>
                <Card style={{ margin: "0.5em" }}>
                  <CardHeader tag="h4">Score</CardHeader>
                  <CardBody tag="h5">{userInfo.score}</CardBody>
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card style={{ margin: "0.5em" }}>
                  <CardHeader tag="h4">Answers</CardHeader>
                  <CardBody tag="h5">{userInfo.score_answers}</CardBody>
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card style={{ margin: "0.5em" }}>
                  <CardHeader tag="h4">Comments</CardHeader>
                  <CardBody tag="h5">{userInfo.score_comments}</CardBody>
                </Card>
              </Col>
              {userInfo.score_cuts > 0 && (
                <Col xs={12} md={6}>
                  <Card style={{ margin: "0.5em" }}>
                    <CardHeader tag="h4">Exam Import</CardHeader>
                    <CardBody tag="h5">{userInfo.score_cuts}</CardBody>
                  </Card>
                </Col>
              )}
              {userInfo.score_legacy > 0 && (
                <Col xs={12} md={6}>
                  <Card style={{ margin: "0.5em" }}>
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
    </>
  );
};
export default UserScoreCard;
