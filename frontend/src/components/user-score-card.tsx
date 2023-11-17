import {
  Button,
  Container,
  SimpleGrid,
  Text,
  Group,
  Paper,
} from "@mantine/core";
import React from "react";
import { logout } from "../api/fetch-utils";
import { useSetUser, useUser } from "../auth";
import { UserInfo } from "../interfaces";
import LoadingOverlay from "./loading-overlay";
import { Icon, ICONS } from "vseth-canine-ui";

interface UserScoreCardProps {
  username?: string;
  userInfo?: UserInfo;
  isMyself: boolean;
}

function scoreCard(
  userInfo: UserInfo | undefined,
  title: string,
  key: keyof UserInfo,
  iconName: string,
) {
  return (
    <Paper shadow="md" withBorder px="md" py="xs">
      <LoadingOverlay loading={!userInfo} />
      <Group position="apart">
        <Text inline size="xs" tt="uppercase" component="p" color="dimmed">
          {title}
        </Text>
        <Text color="dimmed">
          <Icon size="0.75em" icon={iconName} />
        </Text>
      </Group>
      <Text pb="xs" lh={1} fz="xl" fw={600}>
        {userInfo ? userInfo[key] : "-"}
      </Text>
    </Paper>
  );
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
      <Group position="apart" mb="sm">
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
              >
                {user.isAdmin
                  ? "View without admin privileges"
                  : "View with admin privileges"}
              </Button>
            )}
            <Button
              leftIcon={<Icon icon={ICONS.LEAVE} />}
              onClick={() => logout("/")}
            >
              Log out
            </Button>
          </Group>
        )}
      </Group>

      <Container fluid p={0}>
        <SimpleGrid cols={3} breakpoints={[{ maxWidth: "sm", cols: 1 }]}>
          {scoreCard(userInfo, "Score", "score", ICONS.UP)}
          {scoreCard(userInfo, "Answers", "score_answers", ICONS.PEN)}
          {scoreCard(
            userInfo,
            "Comments",
            "score_comments",
            ICONS.MESSAGE_THREE_POINTS,
          )}
          {scoreCard(userInfo, "Documents", "score_documents", ICONS.FILE)}
          {userInfo &&
            userInfo.score_cuts > 0 &&
            scoreCard(userInfo, "Exam Import", "score_cuts", ICONS.FILE_UP)}
          {userInfo &&
            userInfo.score_legacy > 0 &&
            scoreCard(
              userInfo,
              "Wiki Import",
              "score_legacy",
              ICONS.FILE_MISSING_PLUS,
            )}
        </SimpleGrid>
      </Container>
    </>
  );
};
export default UserScoreCard;
