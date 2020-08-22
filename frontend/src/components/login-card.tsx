import { useKeycloak } from "@react-keycloak/web";
import { Button, Card, CardBody, CardHeader } from "@vseth/components";
import React from "react";

const LoginCard: React.FC<{}> = () => {
  const [keycloak, initialized] = useKeycloak();
  // TODO: Handle failed login
  return (
    <Card>
      <CardHeader>Login</CardHeader>
      <CardBody>
        <div className="m-auto">
          <Button
            color="primary"
            disabled={!initialized}
            onClick={() => keycloak.login()}
          >
            Login using VSETH
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};
export default LoginCard;
