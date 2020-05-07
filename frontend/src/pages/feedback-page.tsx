import { useLocalStorageState, useRequest } from "@umijs/hooks";
import {
  Alert,
  Button,
  Col,
  Container,
  FormGroup,
  Input,
  Nav,
  NavItem,
  NavLink,
  Row,
  Spinner,
} from "@vseth/components";
import React, { useEffect, useState } from "react";
import { User, useUser } from "../auth";
import FeedbackEntryComponent from "../components/feedback-entry";
import { loadFeedback, submitFeedback } from "../api/hooks";
import useTitle from "../hooks/useTitle";

enum AdminMode {
  Read,
  Write,
}

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
    <>
      {success && <Alert>Feedback was submited successfully.</Alert>}
      <p>Please tell us what you think about the new Community Solutions!</p>
      <p>What do you like? What could we improve? Ideas for new features?</p>
      <p>
        Use the form below or write to{" "}
        <a href="mailto:communitysolutions@vis.ethz.ch">
          communitysolutions@vis.ethz.ch
        </a>
        .
      </p>
      <p>
        To report issues with the platform you can open an issue in our{" "}
        <a
          href="https://gitlab.ethz.ch/vis/cat/community-solutions/issues"
          target="_blank"
          rel="noopener noreferrer"
        >
          {" "}
          issue tracker
        </a>
        .
      </p>
      <FormGroup>
        <Input
          type="textarea"
          value={text}
          onChange={e => setText(e.currentTarget.value)}
          rows={12}
        />
      </FormGroup>
      <FormGroup>
        <Button
          disabled={text.length === 0 || loading}
          onClick={() => run(text)}
        >
          {loading ? <Spinner /> : "Submit"}
        </Button>
      </FormGroup>
    </>
  );
};

const FeedbackReader: React.FC<{}> = () => {
  const { error, loading, data: feedback, run: reload } = useRequest(
    loadFeedback,
  );

  return (
    <>
      {error && <Alert color="danger">{error.message}</Alert>}
      {feedback && (
        <Row>
          {feedback.map(fb => (
            <Col lg={6} key={fb.oid}>
              <FeedbackEntryComponent entry={fb} entryChanged={reload} />
            </Col>
          ))}
        </Row>
      )}
      {loading && <Spinner />}
    </>
  );
};

const FeedbackAdminView: React.FC<{}> = () => {
  const [mode, setMode] = useLocalStorageState<AdminMode>(
    "feedback-admin-mode",
    AdminMode.Read,
  );
  return (
    <Container>
      <h2>Feedback</h2>
      <Nav tabs className="my-3">
        <NavItem>
          <NavLink
            className={mode === AdminMode.Read ? "active" : ""}
            onClick={() => setMode(AdminMode.Read)}
          >
            Read
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            className={mode === AdminMode.Write ? "active" : ""}
            onClick={() => setMode(AdminMode.Write)}
          >
            Write
          </NavLink>
        </NavItem>
      </Nav>
      {mode === AdminMode.Read ? <FeedbackReader /> : <FeedbackForm />}
    </Container>
  );
};
const FeedbackPage: React.FC<{}> = () => {
  useTitle("Feedback - VIS Community Solutions");
  const { isAdmin } = useUser() as User;
  return isAdmin ? (
    <FeedbackAdminView />
  ) : (
    <Container>
      <h2>Feedback</h2>
      <FeedbackForm />
    </Container>
  );
};
export default FeedbackPage;
