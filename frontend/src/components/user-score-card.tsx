import {
  Button,
  Container,
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
  Icon,
  IconChevronUp,
  IconFile,
  IconFileUpload,
  IconLogout,
  IconMessage,
  IconPencil,
  IconProps,
} from "@tabler/icons-react";

interface UserScoreCardProps {
  username?: string;
  userInfo?: UserInfo;
  isMyself: boolean;
}

function scoreCard(
  userInfo: UserInfo | undefined,
  title: string,
  key: keyof UserInfo,
  Icon: React.ForwardRefExoticComponent<
    Omit<IconProps, "ref"> & React.RefAttributes<Icon>
  >,
) {
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
      <Group justify="space-between" mb="sm">
        <Title order={1} my="md">
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
            <Button leftSection={<IconLogout />} onClick={() => logout("/")} color="red">
              Log out
            </Button>
          </Group>
        )}
      </Group>

      <Container fluid p={0}>
        <SimpleGrid
          cols={{ base: 1, xs: 2, sm: 3, md: 4 }}
        >
          {scoreCard(userInfo, "Score", "score", IconChevronUp)}
          {scoreCard(userInfo, "Answers", "score_answers", IconPencil)}
          {scoreCard(userInfo, "Comments", "score_comments", IconMessage)}
          {scoreCard(userInfo, "Documents", "score_documents", IconFile)}
          {userInfo &&
            userInfo.score_cuts > 0 &&
            scoreCard(userInfo, "Exam Import", "score_cuts", IconFileUpload)}
        </SimpleGrid>
      </Container>
    </>
  );
};
export default UserScoreCard;
