import {
  Button,
  Card,
  Container,
  SimpleGrid,
  Group,
  createStyles,
} from "@mantine/core";
import React from "react";
import { logout } from "../api/fetch-utils";
import { useSetUser, useUser } from "../auth";
import { UserInfo } from "../interfaces";
import LoadingOverlay from "./loading-overlay";

const useStyles = createStyles((theme) => ({
  footer: {
    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[1],
    padding: `${theme.spacing.xs}px ${theme.spacing.lg}px`,
    borderTop: `1.5px solid rgba(51,51,51,.125)`,
  },
}));

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
  const { classes } = useStyles();
  const setUser = useSetUser();
  const user = useUser()!;
  return (
    <>
      <Group position="apart">
        <div>
          <h1>{userInfo?.displayName || username}</h1>
        </div>

        {isMyself && (
          <Group>
            {(user.isAdmin || localStorage.getItem("simulate_nonadmin")) && (
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
            )}
            <Button onClick={() => logout("/")} className="m-2">
              Logout
            </Button>
          </Group>
        )}
      </Group>

      <Container fluid>
        <SimpleGrid cols={3} breakpoints={[{ maxWidth: 'sm', cols: 1 }]}>
          <div>
            <Card withBorder className="m-1">
              <LoadingOverlay loading={!userInfo} />
              <h3 className="p-4 m-0">{userInfo ? userInfo.score : "-"}</h3>
              <Card.Section >
                <Container className={classes.footer}>
                  <h6>Score</h6>
                </Container>
              </Card.Section>
            </Card>
          </div>
          <div>
            <Card withBorder className="m-1">
              <LoadingOverlay loading={!userInfo} />
              <h3 className="p-4 m-0">
                {userInfo ? userInfo.score_answers : "-"}
              </h3>
              <Card.Section>
                <Group className={classes.footer}>
                  <h6>Answers</h6>
                </Group>
              </Card.Section>
            </Card>
          </div>
          <div>
            <Card withBorder className="m-1">
              <LoadingOverlay loading={!userInfo} />
              <h3 className="p-4 m-0">
                {userInfo ? userInfo.score_comments : "-"}
              </h3>
              <Card.Section>
                <Group className={classes.footer}>
                  <h6>Comments</h6>
                </Group>
              </Card.Section>
            </Card>
          </div>
          <div>
            <Card withBorder className="m-1">
              <LoadingOverlay loading={!userInfo} />
              <h3 className="p-4 m-0">
                {userInfo ? userInfo.score_documents : "-"}
              </h3>
              <Card.Section>
                <Group className={classes.footer}>
                  <h6>Documents</h6>
                </Group>
              </Card.Section>
            </Card>
          </div>
          {userInfo && userInfo.score_cuts > 0 && (
            <div>
              <Card className="m-1">
                <h3 className="p-4 m-0">{userInfo.score_cuts}</h3>
                <Card.Section>
                  <Group className={classes.footer}>
                    <h6>Exam Import</h6>
                  </Group>
                </Card.Section>
              </Card>
            </div>
          )}
          {userInfo && userInfo.score_legacy > 0 && (
            <div>
              <Card className="m-1">
                <h3 className="p-4 m-0">{userInfo.score_legacy}</h3>
                <Card.Section>
                  <Group className={classes.footer}>
                    <h6>Wiki Import</h6>
                  </Group>
                </Card.Section>
              </Card>
            </div>
          )}
        </SimpleGrid>
      </Container>
    </>
  );
};
export default UserScoreCard;
