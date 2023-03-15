import { Button, Flex, Text } from "@mantine/core";
import React from "react";
import { login } from "../api/fetch-utils";

const LoginOverlay: React.FC<{}> = () => {
  return (
    <Flex align="center" justify="center" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, textAlign: 'center' }}>
      <div>
        <Text color="gray.0" component="h4" size="1.75rem" weight={700} mb="md">Please Sign in</Text>
        <Button size="lg" color="gray.0" variant="outline" onClick={() => login()}>
          Sign in with AAI
        </Button>
      </div>
    </Flex>
  );
};
export default LoginOverlay;
