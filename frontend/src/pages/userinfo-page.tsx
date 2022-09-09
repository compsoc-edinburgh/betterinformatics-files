import {css, keyframes} from "@emotion/css";
import {
  Alert,
  Col,
  Container,
  Row,
  Spinner,
  TabPane,
  TabContent,
  Nav,
  NavItem,
  NavLink,
} from "@vseth/components";
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useUserInfo } from "../api/hooks";
import { useUser } from "../auth";
import UserAnswers from "../components/user-answers";
import UserComments from "../components/user-comments";
import UserNotifications from "../components/user-notifications";
import UserNotificationsSettings from "../components/user-notification-settings";
import UserDocuments from "../components/user-documents";
import UserPayments from "../components/user-payments";
import UserScoreCard from "../components/user-score-card";
import useTitle from "../hooks/useTitle";

const navStyle = css`
  width: 100%;
  margin-top: 2rem;
  margin-bottom: 2rem;
  justify-content: space-between;
  .nav-item {
    margin: 0;
  }
  .nav-item .nav-link p {
    font-size: x-large;
  }
`;

const fadeIn = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });

export const masonryStyle = css`
  display: flex;
  margin: auto;
  width: 80vw;
  justify-content: center;
  align-items: center;
  position: relative;

  .contribution-component {
    // makes the answer and comment components half the size of the masonry div
    // resulting in 2 columns
    width: 40vw;
    animation: ${fadeIn} 800ms;
  }
  @media only screen and (max-width: 1000px) {
    .contribution-component {
      width: 80vw;
    }
  }
  // fix to counter the odd move to the right that is happening at around 580px width
  @media only screen and (min-width: 580px) {
    left: -10%;
  }
`;

const UserPage: React.FC<{}> = () => {
  const { username } = useParams() as { username: string };
  useTitle(username);
  const user = useUser()!;
  const isMyself = user.username === username;
  const [userInfoError, userInfoLoading, userInfo] = useUserInfo(username);
  const error = userInfoError;
  const loading = userInfoLoading;
  const [activeTab, setActiveTab] = useState("overview");
  return (
    <>
      <Container className="my-3">
        <UserScoreCard
          username={username}
          isMyself={isMyself}
          userInfo={userInfo}
        />
        {error && <Alert color="danger">{error.toString()}</Alert>}
        {loading && <Spinner />}
        <Nav tabs className={navStyle}>
          <NavItem>
            <NavLink
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
              to="#"
            >
              <p>Overview</p>
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              active={activeTab === "answers"}
              onClick={() => setActiveTab("answers")}
              to="#"
            >
              <p>Answers</p>
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              active={activeTab === "comments"}
              onClick={() => setActiveTab("comments")}
              to="#"
            >
              <p>Comments</p>
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              active={activeTab === "documents"}
              onClick={() => setActiveTab("documents")}
              to="#"
            >
              <p>Documents</p>
            </NavLink>
          </NavItem>
          {isMyself && (
            <NavItem>
              <NavLink
                active={activeTab === "settings"}
                onClick={() => setActiveTab("settings")}
                to="#"
              >
                <p>Settings</p>
              </NavLink>
            </NavItem>
          )}
        </Nav>
        <TabContent activeTab={activeTab}>
          <TabPane tabId="overview">
            <Row md={1}>
              {!isMyself && !user.isAdmin && (
                <Alert color="secondary">There's nothing here</Alert>
              )}
              {isMyself && (
                <Col md={6}>
                  <UserNotifications username={username} />
                </Col>
              )}
              {(isMyself || user.isAdmin) && (
                <Col md={6}>
                  <UserPayments username={username} />
                </Col>
              )}
            </Row>
          </TabPane>
          <TabPane tabId="answers">
            <UserAnswers username={username} />
          </TabPane>
          <TabPane tabId="comments">
            <UserComments username={username} />
          </TabPane>
          <TabPane tabId="documents">
            <UserDocuments username={username} userInfo={userInfo} />
          </TabPane>
          <TabPane tabId="settings">
            <Row md={1}>
              {isMyself && (
                <Col md={6}>
                  <UserNotificationsSettings username={username} />
                </Col>
              )}
            </Row>
          </TabPane>
        </TabContent>
      </Container>
    </>
  );
};
export default UserPage;
