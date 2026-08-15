import { useLocalStorageState } from "ahooks";
import {
  Alert,
  Anchor,
  Button,
  Container,
  Divider,
  Grid,
  Stack,
  Tabs,
  Text,
  Textarea,
  Title,
  Loader,
} from "@mantine/core";
import React, { useEffect, useState } from "react";
import { useUser } from "../auth";
import FeedbackEntryComponent from "../components/feedback-entry";
import useTitle from "../hooks/useTitle";
import serverData from "../utils/server-data";
import { useDisclosure } from "@mantine/hooks";
import CollapseWrapper from "../components/collapse-wrapper";
import { parseISO, isValid } from "date-fns";
import { submitFeedback, useListFeedback } from "../api/hooks/feedback";
import type { FeedbackOut } from "../api/model";

const FeedbackForm: React.FC = () => {
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    if (success) {
      const timeout = setTimeout(() => setSuccess(false), 10000);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [success]);

  const [text, setText] = useState("");

  async function handleFeedbackSubmit() {
    await submitFeedback({
      text,
    });

    setText("");
    setSuccess(true);
  }

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
          c="blue"
        >
          {serverData.email_address}
        </Anchor>
        .
      </Text>
      <Text>
        To report issues with the platform you can open an issue in our{" "}
        <Anchor
          component="a"
          c="blue"
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
      <Button disabled={text.length === 0} onClick={handleFeedbackSubmit}>
        Submit
      </Button>
    </Stack>
  );
};

const FeedbackReader: React.FC = () => {
  const feedbacks = useListFeedback();

  const [opened, { toggle }] = useDisclosure(false);

  const mapEntries = (feedback: readonly FeedbackOut[]) => {
    return (
      <Grid>
        {feedback.map(fb => (
          <Grid.Col span={{ lg: 6 }} key={fb.oid}>
            <FeedbackEntryComponent
              entry={fb}
              entryChanged={() => {
                feedbacks.refetch();
              }}
            />
          </Grid.Col>
        ))}
      </Grid>
    );
  };

  feedbacks.data?.value
    .map(fb => {
      const date = parseISO(fb.time);
      return {
        ...fb,
        date: isValid(date) ? date : new Date(0),
      };
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const categorized = {
    waiting_action:
      feedbacks.data?.value.filter(fb => !fb.read && !fb.done) ?? [],
    read_and_done: feedbacks.data?.value.filter(fb => fb.read && fb.done) ?? [],
    done: feedbacks.data?.value.filter(fb => !fb.read && fb.done) ?? [],
    read: feedbacks.data?.value.filter(fb => fb.read && !fb.done) ?? [],
  };

  return (
    <>
      {feedbacks.error && (
        <Alert color="red">{(feedbacks.error as Error).message}</Alert>
      )}
      {feedbacks.isSuccess && (
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
      {feedbacks.isLoading && <Loader />}
    </>
  );
};

const FeedbackAdminView: React.FC = () => {
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
const FeedbackPage: React.FC = () => {
  useTitle("Feedback");
  const { isAdmin } = useUser()!;
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
