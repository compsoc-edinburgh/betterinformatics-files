import React, { useState } from "react";
import { Container, Input, Button, FormGroup } from "@vseth/components";
import { Link } from "react-router-dom";

const FeedbackPage: React.FC<{}> = () => {
  const [text, setText] = useState("");
  return (
    <Container>
      <h2>Feedback</h2>
      <p>
        Please tell us what you think about the new Community Solutions! What do
        you like? What could we improve? Ideas for new features?
      </p>
      <p>
        Use the form below or write to{" "}
        <Link to="mailto:communitysolutions@vis.ethz.ch">
          communitysolutions@vis.ethz.ch
        </Link>
        .
      </p>
      <p>
        To report issues with the platform you can open an issue in our{" "}
        <Link to="https://gitlab.ethz.ch/vis/cat/community-solutions/issues">
          issue tracker
        </Link>
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
        <Button disabled={text.length === 0} loading={true}>
          Send
        </Button>
      </FormGroup>
    </Container>
  );
};
export default FeedbackPage;
