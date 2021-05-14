import { useKeycloak } from "@react-keycloak/web";
import { Button } from "@vseth/components";
import React from "react";

const LoginOverlay: React.FC<{}> = () => {
  const { keycloak, initialized } = useKeycloak();
  return (
    <div className="text-center position-cover d-flex align-items-center justify-content-center">
      <div>
        <h4 className="mb-4 font-weight-bold text-white">Please Sign in</h4>
        <Button
          size="lg"
          color="primary"
          disabled={!initialized}
          onClick={() => keycloak.login()}
        >
          Sign in with AAI
        </Button>
      </div>
    </div>
  );
};
export default LoginOverlay;
