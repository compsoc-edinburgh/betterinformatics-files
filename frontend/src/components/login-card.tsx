import { useRequest } from "@umijs/hooks";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  Form,
  InputField,
} from "@vseth/components";
import React, { useState } from "react";
import { useSetUser } from "../auth";
import { fetchpost } from "../fetch-utils";

const login = async (
  username: string,
  password: string,
  simulate_nonadmin: boolean,
) => {
  await fetchpost("/api/login", {
    username,
    password,
    simulate_nonadmin,
  });
};

const LoginCard: React.FC<{}> = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const setUser = useSetUser();
  const { loading, run: tryLogin } = useRequest(login, {
    manual: true,
    onSuccess: e => {
      setUser(undefined);
      setError(undefined);
    },
    onError: e => setError(e.toString()),
  });
  return (
    <Card>
      <CardHeader>Login</CardHeader>
      <CardBody>
        <Form
          onSubmit={e => {
            e.preventDefault();
            tryLogin(username, password, false);
          }}
        >
          {error && <Alert color="danger">{error}</Alert>}
          <InputField
            type="text"
            label="Username"
            id="username-field"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.currentTarget.value)}
            disabled={loading}
            required
          />
          <InputField
            label="Password"
            type="password"
            id="password-field"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.currentTarget.value)}
            disabled={loading}
            required
          />
          <Button color="primary" type="submit" disabled={loading}>
            Submit
          </Button>
        </Form>
      </CardBody>
    </Card>
  );
};
export default LoginCard;
