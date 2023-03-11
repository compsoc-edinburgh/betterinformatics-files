import { css, keyframes } from "@emotion/css";
import { Container, Alert, Loader, Tabs, SimpleGrid } from "@mantine/core";
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
  left: 50%;
  transform: translateX(-50%);

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
`;

const UserPage: React.FC<{}> = () => {
  const user = useUser()!;
  const { username = user.username } = useParams() as { username: string };
  useTitle(username);
  const isMyself = user.username === username;
  const [userInfoError, userInfoLoading, userInfo] = useUserInfo(username);
  const error = userInfoError;
  const loading = userInfoLoading;
  const [activeTab, setActiveTab] = useState<string | null>("overview");
  return (
    <>
      <Container size="xl" className="my-3">
        <UserScoreCard
          username={username}
          isMyself={isMyself}
          userInfo={userInfo}
        />
        {error && <Alert color="danger">{error.toString()}</Alert>}
        {loading && <Loader />}
        <Tabs color="blue" value={activeTab} onTabChange={setActiveTab} className={navStyle}>
          <Tabs.List grow>
            <Tabs.Tab value="overview">Overview</Tabs.Tab>
            <Tabs.Tab value="answers">Answers</Tabs.Tab>
            <Tabs.Tab value="comments">Comments</Tabs.Tab>
            <Tabs.Tab value="documents">Documents</Tabs.Tab>
            {isMyself && <Tabs.Tab value="settings">Settings</Tabs.Tab>}
          </Tabs.List>
          <Tabs.Panel value="overview">
            <SimpleGrid cols={2}>
              {!isMyself && !user.isAdmin && (
                <Alert color="secondary">There's nothing here</Alert>
              )}
              {isMyself && (
                <UserNotifications username={username} />
              )}
              {(isMyself || user.isAdmin) && (
                <UserPayments username={username} />
              )}
            </SimpleGrid>
          </Tabs.Panel>
          <Tabs.Panel value="answers">
            <UserAnswers username={username} />
          </Tabs.Panel>
          <Tabs.Panel value="comments">
            <UserComments username={username} />
          </Tabs.Panel>
          <Tabs.Panel value="documents">
            <UserDocuments username={username} userInfo={userInfo} />
          </Tabs.Panel>
          <Tabs.Panel value="settings">
            {isMyself && <UserNotificationsSettings username={username} />}
          </Tabs.Panel>
        </Tabs>
      </Container>
    </>
  );
};
export default UserPage;
