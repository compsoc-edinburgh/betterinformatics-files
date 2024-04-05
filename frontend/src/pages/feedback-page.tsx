import { useLocalStorageState, useRequest } from "@umijs/hooks";
import {
  Alert,
  Anchor,
  Button,
  Container,
  Grid,
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
        Please tell us what you think about Community Solutions! What do you
        like? What could we improve? Ideas for new features? Use the form below
        or write to{" "}
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
          href="https://gitlab.ethz.ch/vis/cat/community-solutions/issues"
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

  return (
    <>
      {error && <Alert color="red">{error.message}</Alert>}
      {feedback && (
        <Grid>
          {feedback.map(fb => (
            <Grid.Col span={{ lg: 6 }} key={fb.oid}>
              <FeedbackEntryComponent entry={fb} entryChanged={reload} />
            </Grid.Col>
          ))}
        </Grid>
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
