import {
  Button,
  Card,
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
const UserScoreCard: React.FC<UserScoreCardProps> = ({
  username,
  userInfo,
  isMyself,
}) => {
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

      <Container fluid p={0}>
        <SimpleGrid cols={3} breakpoints={[{ maxWidth: "sm", cols: 1 }]}>
          <Paper shadow="md" withBorder p="md">
            <LoadingOverlay loading={!userInfo} />
            <Group position="apart">
              <Text inline size="xs" tt="uppercase" component="p" color="dimmed">Score</Text>
              <Icon size="0.75em" icon={ICONS.UP} color="dimmed"/>
            </Group>
            <Text fz="xl" fw={600}>{userInfo ? userInfo.score : "-"}</Text>
          </Paper>
          <Paper shadow="md" withBorder p="md">
            <LoadingOverlay loading={!userInfo} />
            <Group position="apart">
              <Text inline size="xs" tt="uppercase" component="p" color="dimmed">Answers</Text>
              <Icon size="0.75em" icon={ICONS.PEN} color="dimmed"/>
            </Group>
            <Text fz="xl" fw={600}>
              {userInfo ? userInfo.score_answers : "-"}
            </Text>
          </Paper>
          <Paper shadow="md" withBorder p="md">
            <LoadingOverlay loading={!userInfo} />
            <Group position="apart">
              <Text inline size="xs" tt="uppercase" component="p" color="dimmed">Comments</Text>
              <Icon size="0.75em" icon={ICONS.MESSAGE_THREE_POINTS} color="dimmed"/>
            </Group>
            <Text fz="xl" fw={600}>
              {userInfo ? userInfo.score_comments : "-"}
            </Text>
          </Paper>
          <Paper shadow="md" withBorder p="md">
            <LoadingOverlay loading={!userInfo} />
            <Group position="apart">
              <Text inline size="xs" tt="uppercase" component="p" color="dimmed">Documents</Text>
              <Icon size="0.75em" icon={ICONS.FILE} color="dimmed"/>
            </Group>
            <Text fz="xl" fw={600}>
              {userInfo ? userInfo.score_documents : "-"}
            </Text>
          </Paper>
          {userInfo && userInfo.score_cuts > 0 && (
            <Paper shadow="md" withBorder p="md">
              <LoadingOverlay loading={!userInfo} />
              <Group position="apart">
                <Text inline size="xs" tt="uppercase" component="p" color="dimmed">Exam Import</Text>
                <Icon size="0.75em" icon={ICONS.FILE} color="dimmed"/>
              </Group>
              <Text fz="xl" fw={600}>
                {userInfo.score_cuts}
              </Text>
            </Paper>
          )}
          {userInfo && userInfo.score_legacy > 0 && (
            <Paper shadow="md" withBorder p="md">
              <LoadingOverlay loading={!userInfo} />
              <Group position="apart">
                <Text inline size="xs" tt="uppercase" component="p" color="dimmed">Wiki Import</Text>
                <Icon size="0.75em" icon={ICONS.FILE} color="dimmed"/>
              </Group>
              <Text fz="xl" fw={600}>
                {userInfo.score_legacy}
              </Text>
            </Paper>
          )}
        </SimpleGrid>
      </Container>
    </>
  );
};
export default UserScoreCard;
