import { Button } from "@mantine/core";
import React from "react";
import { login } from "../api/fetch-utils";

const LoginOverlay: React.FC<{}> = () => {
  return (
    <div className="text-center position-cover d-flex align-items-center justify-content-center">
      <div>
        <h4 className="mb-4 font-weight-bold text-white">Please Sign in</h4>
        <Button size="lg" color="gray.0" variant="outline" onClick={() => login()}>
          Sign in with AAI
        </Button>
      </div>
    </div>
  );
};
export default LoginOverlay;
