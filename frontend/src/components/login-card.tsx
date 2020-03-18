import { useRequest } from "@umijs/hooks";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Form,
  FormGroup,
  InputField,
  Row,
  Select,
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

const debugLogins = {
  schneij: "UOmtnC7{'%G",
  fletchz: "123456abc",
  morica: "admin666",
};
const options = Object.keys(debugLogins).map(username => ({
  value: username,
  label: username,
}));

const LoginCard: React.FC<{}> = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const setUser = useSetUser();
  const { loading, run: tryLogin } = useRequest(login, {
    manual: true,
    onSuccess: e => {
      setError(undefined);
      setUser(undefined);
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
          <Row form>
            <Col md={4}>
              {" "}
              <FormGroup>
                <Button color="primary" type="submit" disabled={loading}>
                  Submit
                </Button>
              </FormGroup>
            </Col>
            <Col md={8}>
              <FormGroup>
                {window.location.hostname === "localhost" && (
                  <Select
                    options={options}
                    onChange={({ value }: any) => {
                      setUsername(value);
                      setPassword(
                        debugLogins[value as keyof typeof debugLogins],
                      );
                    }}
                  />
                )}
              </FormGroup>
            </Col>
          </Row>
        </Form>
      </CardBody>
    </Card>
  );
};
export default LoginCard;
