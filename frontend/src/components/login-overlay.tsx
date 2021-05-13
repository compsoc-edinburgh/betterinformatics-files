import { useKeycloak } from "@react-keycloak/web";
import { Button } from "@vseth/components";
import React from "react";
import IconButton from "./icon-button";

const LoginOverlay: React.FC<{}> = () => {
  const { keycloak, initialized } = useKeycloak();
  return (
    <>
      <div className="py-4 text-center">
        <div className="my-1 font-weight-bold">Please Sign in</div>
        <Button
          size="lg"
          color="primary"
          disabled={!initialized}
          onClick={() => keycloak.login()}
        >
          Sign in with AAI
        </Button>
      </div>
    </>
  );
};
export default LoginOverlay;
