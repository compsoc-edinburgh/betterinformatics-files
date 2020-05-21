import {
  Alert,
  Button,
  Card,
  CardFooter,
  Col,
  Container,
  Row,
} from "@vseth/components";
import React from "react";
import { notLoggedIn, useSetUser, useUser } from "../auth";
import { useLogout } from "../api/hooks";
import { UserInfo } from "../interfaces";
import LoadingOverlay from "./loading-overlay";
import { useRequest } from "@umijs/hooks";
import { fetchPost } from "../api/fetch-utils";

const setNonAdmin = (simulate_nonadmin: boolean) =>
  fetchPost("/api/auth/simulate_nonadmin/", { simulate_nonadmin });

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
  const user = useUser()!;
  const [logoutError, logoutLoading, logout] = useLogout(() =>
    setUser(notLoggedIn),
  );
  const { run: runSetNonAdmin } = useRequest(setNonAdmin, {
    manual: true,
    onSuccess: () => setUser(undefined),
  });
  return (
    <>
      {logoutError && <Alert color="danger">{logoutError.message}</Alert>}
      <Row>
        <Col>
          <h1>{userInfo?.displayName || username}</h1>
        </Col>
        <Col xs="auto">
          {isMyself && (
            <>
              {(user.isAdmin || user.simulateNonadmin) && (
                <Button
                  disabled={logoutLoading}
                  onClick={() => runSetNonAdmin(!user.simulateNonadmin)}
                >
                  {user.isAdmin
                    ? "View without admin privileges"
                    : "View with admin privileges"}
                </Button>
              )}
              <Button disabled={logoutLoading} onClick={logout}>
                Logout
              </Button>
            </>
          )}
        </Col>
      </Row>

      <Container fluid>
        <Row>
          <Col md={6} lg={4}>
            <Card className="m-1">
              <LoadingOverlay loading={!userInfo} />
              <h3 className="p-4 m-0">{userInfo ? userInfo.score : "-"}</h3>
              <CardFooter tag="h6" className="m-0">
                Score
              </CardFooter>
            </Card>
          </Col>
          <Col md={6} lg={4}>
            <Card className="m-1">
              <LoadingOverlay loading={!userInfo} />
              <h3 className="p-4 m-0">
                {userInfo ? userInfo.score_answers : "-"}
              </h3>
              <CardFooter tag="h6" className="m-0">
                Answers
              </CardFooter>
            </Card>
          </Col>
          <Col md={6} lg={4}>
            <Card className="m-1">
              <LoadingOverlay loading={!userInfo} />
              <h3 className="p-4 m-0">
                {userInfo ? userInfo.score_comments : "-"}
              </h3>
              <CardFooter tag="h6" className="m-0">
                Comments
              </CardFooter>
            </Card>
          </Col>
          {userInfo && userInfo.score_cuts > 0 && (
            <Col md={6} lg={4}>
              <Card className="m-1">
                <h3 className="p-4 m-0">{userInfo.score_cuts}</h3>
                <CardFooter tag="h6" className="m-0">
                  Exam Import
                </CardFooter>
              </Card>
            </Col>
          )}
          {userInfo && userInfo.score_legacy > 0 && (
            <Col md={6} lg={4}>
              <Card className="m-1">
                <h3 className="p-4 m-0">{userInfo.score_legacy}</h3>
                <CardFooter tag="h6" className="m-0">
                  Wiki Import
                </CardFooter>
              </Card>
            </Col>
          )}
        </Row>
      </Container>
    </>
  );
};
export default UserScoreCard;
