import { useLocalStorageState, useRequest } from "@umijs/hooks";
import {
  Anchor,
  Alert,
  Center,
  Container,
  Group,
  Table,
  UnstyledButton,
  Text,
  createStyles,
} from "@mantine/core";
import React from "react";
import { Link } from "react-router-dom";
import LoadingOverlay from "../components/loading-overlay";
import { fetchGet } from "../api/fetch-utils";
import { UserInfo } from "../interfaces";
import useTitle from "../hooks/useTitle";
import { css } from "@emotion/css";
import { Icon, ICONS } from "vseth-canine-ui";
const overflowScroll = css`
  overflow: auto;
`;
const modes = [
  "score",
  "score_answers",
  "score_comments",
  "score_cuts",
  "score_documents",
] as const;
type Mode = (typeof modes)[number];
const loadScoreboard = async (scoretype: Mode) => {
  return (await fetchGet(`/api/scoreboard/top/${scoretype}/`))
    .value as UserInfo[];
};

const useStyles = createStyles(theme => ({
  th: {
    padding: "0 !important",
  },

  control: {
    width: "100%",
    padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,

    "&:hover": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.dark[6]
          : theme.colors.gray[0],
    },
  },

  icon: {
    width: 21,
    height: 21,
    borderRadius: 21,
  },
}));

interface ThProps {
  children: React.ReactNode;
  sorted: boolean;
  onSort(): void;
}

function Th({ children, sorted, onSort }: ThProps) {
  const { classes } = useStyles();
  const iconName = sorted ? ICONS.DOWN : ICONS.ARROW_UP_DOWN;
  return (
    <th className={classes.th}>
      <UnstyledButton onClick={onSort} className={classes.control}>
        <Group position="apart">
          <Text weight={700} size="md">
            {children}
          </Text>
          <Center className={classes.icon} mr={4}>
            <Icon icon={iconName} size={12} color="gray" />
          </Center>
        </Group>
      </UnstyledButton>
    </th>
  );
}

const Scoreboard: React.FC<{}> = () => {
  useTitle("Scoreboard");
  const [mode, setMode] = useLocalStorageState<Mode>(
    "scoreboard-mode",
    "score",
  );
  const { error, loading, data } = useRequest(() => loadScoreboard(mode), {
    refreshDeps: [mode],
    cacheKey: `scoreboard-${mode}`,
  });
  return (
    <Container size="xl">
      <h1>Scoreboard</h1>
      {error && <Alert color="red">{error.message}</Alert>}
      <LoadingOverlay loading={loading} />
      <div className={overflowScroll}>
        <Table
          striped
          highlightOnHover
          verticalSpacing="md"
          fontSize="md"
          mb="xl"
        >
          <thead>
            <tr>
              <th>
                <Text weight={700} size="md" color="black">
                  Rank
                </Text>
              </th>
              <th>
                <Text weight={700} size="md" color="black">
                  User
                </Text>
              </th>
              <Th onSort={() => setMode("score")} sorted={mode === "score"}>
                Score
              </Th>
              <Th
                onSort={() => setMode("score_answers")}
                sorted={mode === "score_answers"}
              >
                Answers
              </Th>
              <Th
                onSort={() => setMode("score_comments")}
                sorted={mode === "score_comments"}
              >
                Comments
              </Th>
              <Th
                onSort={() => setMode("score_documents")}
                sorted={mode === "score_documents"}
              >
                Documents
              </Th>
              <Th
                onSort={() => setMode("score_cuts")}
                sorted={mode === "score_cuts"}
              >
                Import Exams
              </Th>
            </tr>
          </thead>
          <tbody>
            {data &&
              data.map((board, idx) => (
                <tr key={board.username}>
                  <td>{idx + 1}</td>
                  <td>
                    <Anchor component={Link} to={`/user/${board.username}`}>
                      {board.displayName}
                    </Anchor>
                  </td>
                  <td>{board.score}</td>
                  <td>{board.score_answers}</td>
                  <td>{board.score_comments}</td>
                  <td>{board.score_documents}</td>
                  <td>{board.score_cuts}</td>
                </tr>
              ))}
          </tbody>
        </Table>
      </div>
    </Container>
  );
};
export default Scoreboard;
