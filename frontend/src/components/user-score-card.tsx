import {
  Button,
  Container,
  SimpleGrid,
  Text,
  Group,
  Paper,
  LoadingOverlay,
} from "@mantine/core";
import React from "react";
import { logout } from "../api/fetch-utils";
import { useSetUser, useUser } from "../auth";
import { UserInfo } from "../interfaces";
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
    <Paper shadow="md" withBorder px="md" py="xs" pos="relative">
      <LoadingOverlay visible={!userInfo} />
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
        <SimpleGrid cols={4} breakpoints={[{ maxWidth: "sm", cols: 1 }, { maxWidth: "md", cols: 2 }]}>
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
        </SimpleGrid>
      </Container>
    </>
  );
};
export default UserScoreCard;
