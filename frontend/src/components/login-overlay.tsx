import { useKeycloak } from "@react-keycloak/web";
import React from "react";
import IconButton from "./icon-button";

const LoginOverlay: React.FC<{}> = () => {
  const { keycloak, initialized } = useKeycloak();
  return (
    <>
      <div className="py-4 text-center">
        <div className="my-3">Please Sign in</div>
        <IconButton
          size="lg"
          icon="VSETH"
          color="primary"
          disabled={!initialized}
          onClick={() => keycloak.login()}
        >
          Sign in with VSETH
        </IconButton>
      </div>
    </>
  );
};
export default LoginOverlay;
