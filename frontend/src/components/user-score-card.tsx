import {
  Button,
  SimpleGrid,
  Text,
  Group,
  Paper,
  LoadingOverlay,
  Title,
} from "@mantine/core";
import React from "react";
import { logout } from "../api/fetch-utils";
import { useSetUser, useUser } from "../auth";
import { UserInfo } from "../interfaces";
import {
  IconChevronUp,
  IconFile,
  IconFileUpload,
  IconLogout,
  IconMessage,
  IconPencil,
  IconTrophy,
  TablerIcon,
} from "@tabler/icons-react";
import displayNameClasses from "../utils/display-name.module.css";

interface ScoreCardProps {
  userInfo: UserInfo | undefined;
  title: string;
  key_: keyof UserInfo;
  Icon: TablerIcon;
}

const ScoreCard: React.FC<ScoreCardProps> = ({
  userInfo,
  title,
  key_,
  Icon,
}) => {
  return (
    <Paper shadow="md" withBorder px="md" py="lg" pos="relative">
      <LoadingOverlay visible={!userInfo} />
      <Group justify="space-between" mb="xs">
        <Text inline size="xs" tt="uppercase" component="p" c="dimmed">
          {title}
        </Text>
        <Icon
          style={{
            width: "1em",
            height: "1em",
            color: "var(--mantine-color-dimmed)",
          }}
        />
      </Group>
      <Text lh={1} fz="xl" fw={600}>
        {userInfo ? userInfo[key_] : "-"}
      </Text>
    </Paper>
  );
};

interface RankCardProps {
  userInfo: UserInfo | undefined;
  Icon: TablerIcon;
}

const RankCard: React.FC<RankCardProps> = ({ userInfo, Icon }) => {
  return (
    <Paper shadow="md" withBorder px="md" py="lg" pos="relative">
      <LoadingOverlay visible={!userInfo} />
      <Group justify="space-between" mb="xs">
        <Text inline size="xs" tt="uppercase" component="p" c="dimmed">
          Score Percentile
        </Text>
        <Icon
          style={{
            width: "1em",
            height: "1em",
            color: "var(--mantine-color-dimmed)",
          }}
        />
      </Group>
      <Text lh={1} fz="xl" fw={600}>
        {userInfo
          ? `Top ${(Math.round((userInfo.rank / userInfo.total_users) * 1000) / 10).toFixed(1)}%`
          : "-"}
      </Text>
    </Paper>
  );
};

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
      <Group justify="space-between" mb="sm">
        <Title
          order={1}
          my="md"
          className={displayNameClasses.shrinkableDisplayName}
        >
          @{username}{" "}
          {userInfo &&
            userInfo.displayName !== username &&
            `(${userInfo.displayName})`}
        </Title>

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
                variant="outline"
              >
                {user.isAdmin
                  ? "View without admin privileges"
                  : "View with admin privileges"}
              </Button>
            )}
            <Button
              leftSection={<IconLogout />}
              onClick={() => logout("/")}
              color="red"
            >
              Log out
            </Button>
          </Group>
        )}
      </Group>

      <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, md: 4 }}>
        <RankCard userInfo={userInfo} Icon={IconTrophy} />
        <ScoreCard
          userInfo={userInfo}
          title="Score"
          key_="score"
          Icon={IconChevronUp}
        />
        <ScoreCard
          userInfo={userInfo}
          title="Answers"
          key_="score_answers"
          Icon={IconPencil}
        />
        <ScoreCard
          userInfo={userInfo}
          title="Comments"
          key_="score_comments"
          Icon={IconMessage}
        />
        <ScoreCard
          userInfo={userInfo}
          title="Documents"
          key_="score_documents"
          Icon={IconFile}
        />
        {userInfo && userInfo.score_cuts > 0 && (
          <ScoreCard
            userInfo={userInfo}
            title="Exam Import"
            key_="score_cuts"
            Icon={IconFileUpload}
          />
        )}
      </SimpleGrid>
    </>
  );
};
export default UserScoreCard;
