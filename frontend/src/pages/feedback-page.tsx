import { useLocalStorageState, useRequest } from "@umijs/hooks";
import {
  Alert,
  Anchor,
  Button,
  Collapse,
  Container,
  Divider,
  Grid,
  Group,
  Stack,
  Tabs,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import React, { useEffect, useState } from "react";
import { User, useUser } from "../auth";
import FeedbackEntryComponent from "../components/feedback-entry";
import { loadFeedback, submitFeedback } from "../api/hooks";
import useTitle from "../hooks/useTitle";
import serverData from "../utils/server-data";
import { Loader } from "@mantine/core";
import { FeedbackEntry } from "../interfaces";
import { useDisclosure } from "@mantine/hooks";
import TooltipButton from "../components/TooltipButton";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import CollapseWrapper from "../components/collapse-wrapper";

const FeedbackForm: React.FC<{}> = () => {
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    if (success) {
      const timeout = window.setTimeout(() => setSuccess(false), 10000);
      return () => {
        window.clearTimeout(timeout);
      };
    }
  });

  const [text, setText] = useState("");
  const { loading, run } = useRequest(submitFeedback, {
    manual: true,
    onSuccess() {
      setText("");
      setSuccess(true);
    },
  });

  return (
    <Stack>
      {success && <Alert>Feedback was submitted successfully.</Alert>}
      <Text>
        Please tell us what you think about BetterInformatics File Collection!
        What do you like? What could we improve? Ideas for new features? Use the
        form below or write to{" "}
        <Anchor
          component="a"
          href={`mailto:${serverData.email_address}`}
          color="blue"
        >
          {serverData.email_address}
        </Anchor>
        .
      </Text>
      <Text>
        To report issues with the platform you can open an issue in our{" "}
        <Anchor
          component="a"
          color="blue"
          href="https://github.com/compsoc-edinburgh/betterinformatics-files"
          target="_blank"
          rel="noopener noreferrer"
        >
          issue tracker
        </Anchor>
        .
      </Text>
      <Textarea
        placeholder="Tell us your feedback..."
        value={text}
        onChange={e => setText(e.currentTarget.value)}
        minRows={12}
      />
      <Button
        loading={loading}
        disabled={text.length === 0 || loading}
        onClick={() => run(text)}
      >
        Submit
      </Button>
    </Stack>
  );
};

const FeedbackReader: React.FC<{}> = () => {
  const {
    error,
    loading,
    data: feedback,
    run: reload,
  } = useRequest(loadFeedback);

  const [opened, { toggle }] = useDisclosure(false);

  const mapEntries = (feedback: FeedbackEntry[]) => {
    return (
      <Grid>
        {feedback.map(fb => (
          <Grid.Col span={{ lg: 6 }} key={fb.oid}>
            <FeedbackEntryComponent entry={fb} entryChanged={reload} />
          </Grid.Col>
        ))}
      </Grid>
    );
  };

  const categorized = {
    waiting_action: [] as FeedbackEntry[],
    done: [] as FeedbackEntry[],
    read: [] as FeedbackEntry[],
    read_and_done: [] as FeedbackEntry[],
  };

  if (feedback) {
    feedback.forEach(fb => {
      if (!fb.read && !fb.done) {
        categorized.waiting_action.push(fb);
      } else if (fb.read && fb.done) {
        categorized.read_and_done.push(fb);
      } else {
        if (fb.done) {
          categorized.done.push(fb);
        }
        if (fb.read) {
          categorized.read.push(fb);
        }
      }
    });
  }

  return (
    <>
      {error && <Alert color="red">{error.message}</Alert>}
      {feedback && (
        <>
          {mapEntries(categorized.waiting_action)}
          <Divider my="xl" />
          <Title order={2}>Done</Title>
          {mapEntries(categorized.done)}
          <Divider my="xl" />
          <Title order={2}>Read</Title>
          {mapEntries(categorized.read)}
          <Divider my="xl" />
          <CollapseWrapper
            title={<Title order={2}>Read and Done</Title>}
            contentOutsideCollapse={<></>}
            contentInsideCollapse={<>{mapEntries(categorized.read_and_done)}</>}
            is_collapsed={() => opened}
            collapse_expand={() => toggle()}
          />
        </>
      )}
      {loading && <Loader />}
    </>
  );
};

const FeedbackAdminView: React.FC<{}> = () => {
  const [mode, setMode] = useLocalStorageState<string | null>(
    "feedback-admin-mode",
    "read",
  );
  return (
    <Container size="xl">
      <Title order={2}>Feedback</Title>
      <Tabs value={mode} onChange={setMode} my="sm">
        <Tabs.List defaultValue="read">
          <Tabs.Tab value="read">Read</Tabs.Tab>
          <Tabs.Tab value="write">Write</Tabs.Tab>
        </Tabs.List>
      </Tabs>
      {mode === "read" ? <FeedbackReader /> : <FeedbackForm />}
    </Container>
  );
};
const FeedbackPage: React.FC<{}> = () => {
  useTitle("Feedback");
  const { isAdmin } = useUser() as User;
  return isAdmin ? (
    <FeedbackAdminView />
  ) : (
    <Container size="xl">
      <Title order={2} mb="sm">
        Feedback
      </Title>
      <FeedbackForm />
    </Container>
  );
};
export default FeedbackPage;
