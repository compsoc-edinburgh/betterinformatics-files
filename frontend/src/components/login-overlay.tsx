import { Button, InputField, FormGroup, Form, Label, Input } from "@vseth/components";
import React, { useState } from "react";
import { login } from "../api/fetch-utils";

const LoginOverlay: React.FC<{}> = () => {
  const [email, setEmail] = useState("");

  return (
    <div className="text-left position-cover d-flex align-items-center justify-content-center">
      <div>
        <h4 className="mb-4 font-weight-bold text-white">Sign in to view</h4>
        <Form>
          <FormGroup className="m-1">
            <Label for="login-email" className="text-white">
              University Email:
            </Label>
            <Input
              type="email"
              className="login-email"
              placeholder="f.lastname@sms.ed.ac.uk"
              value={email}
              onChange={e => setEmail(e.currentTarget.value)}
              autoFocus />
            <Button className="mt-3" size="lg" color="white" outline onClick={() => login()}>
              Sign in
            </Button>
          </FormGroup>
        </Form>
      </div>
    </div>
  );
};
export default LoginOverlay;
