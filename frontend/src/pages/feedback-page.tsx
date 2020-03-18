import React, { useState } from "react";
import {
  Container,
  Button,
  FormGroup,
  Spinner,
  Input,
  Nav,
  NavLink,
  NavItem,
} from "@vseth/components";
import { Link } from "react-router-dom";
import { fetchpost } from "../fetch-utils";
import { useRequest, useLocalStorageState } from "@umijs/hooks";
import { useUser, User } from "../auth";

enum AdminMode {
  Read,
  Write,
}

const submitFeedback = async (text: string) => {
  return await fetchpost("api/feedback/submit", { text });
};

const FeedbackForm: React.FC<{}> = () => {
  const [text, setText] = useState("");
  const { loading, run } = useRequest(submitFeedback, {
    manual: true,
    onSuccess() {
      setText("");
    },
  });

  return (
    <>
      <p>
        Please tell us what you think about the new Community Solutions! What do
        you like? What could we improve? Ideas for new features?
      </p>
      <p>
        Use the form below or write to{" "}
        <a href="mailto:communitysolutions@vis.ethz.ch">
          communitysolutions@vis.ethz.ch
        </a>
        .
      </p>
      <p>
        To report issues with the platform you can open an issue in our{" "}
        <a href="https://gitlab.ethz.ch/vis/cat/community-solutions/issues">
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
const FeedbackAdminView: React.FC<{}> = () => {
  const [mode, setMode] = useLocalStorageState<AdminMode>(
    "feedback-admin-mode",
    AdminMode.Read,
  );
  return (
    <Container>
      <h2>Feedback</h2>
      <Nav tabs>
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
      {mode === AdminMode.Read ? null : <FeedbackForm />}
    </Container>
  );
};
const FeedbackPage: React.FC<{}> = () => {
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
