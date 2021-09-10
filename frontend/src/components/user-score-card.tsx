import {
  Button,
  Card,
  CardFooter,
  Col,
  Container,
  Row,
} from "@vseth/components";
import React from "react";
import { logout } from "../api/fetch-utils";
import { useSetUser, useUser } from "../auth";
import { UserInfo } from "../interfaces";
import LoadingOverlay from "./loading-overlay";

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
  return (
    <>
      <Row form>
        <Col>
          <h1>{userInfo?.displayName || username}</h1>
        </Col>

        {isMyself && (
          <>
            {(user.isAdmin || localStorage.getItem("simulate_nonadmin")) && (
              <Col xs="auto">
                <Button
                  onClick={() => {
                    if (user.isAdmin) {
                      localStorage.setItem("simulate_nonadmin", "true");
                    } else {
                      localStorage.removeItem("simulate_nonadmin");
                    }
                    setUser(undefined);
                  }}
                  className="m-2"
                >
                  {user.isAdmin
                    ? "View without admin privileges"
                    : "View with admin privileges"}
                </Button>
              </Col>
            )}
            <Col xs="auto">
              <Button onClick={() => logout("/")} className="m-2">
                Logout
              </Button>
            </Col>
          </>
        )}
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
          <Col md={6} lg={4}>
            <Card className="m-1">
              <LoadingOverlay loading={!userInfo} />
              <h3 className="p-4 m-0">
                {userInfo ? userInfo.score_documents : "-"}
              </h3>
              <CardFooter tag="h6" className="m-0">
                Documents
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
