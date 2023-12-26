import {
  Button,
  Loader,
  Group,
  Flex,
  PinInput,
  TextInput,
  Title,
  Text,
  Anchor,
} from "@mantine/core";
import React, { FormEventHandler, useState, useEffect } from "react";
import { sendLoginCode, verifyLoginCode } from "../api/fetch-utils";
import { useLocation } from "react-router-dom";

export enum LoginState {
  AWAITING_UUN_INPUT,
  AWAITING_PROCESSING_AGREEMENT,
  AWAITING_CODE_INPUT,
  PROCESSING
}

const LoginOverlay: React.FC<{}> = () => {
  const [uun, setUUN] = useState("");
  const [processingAgreement, setProcessingAgreement] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const rd = new URLSearchParams(useLocation().search).get("rd");

  const [loginState, setLoginState] = useState(LoginState.AWAITING_UUN_INPUT);

  const handleSubmitUUN: FormEventHandler<HTMLFormElement> = async e => {
    e.preventDefault();
    setError("");
    setLoginState(LoginState.PROCESSING);
    try {
      const consentRequired = true; // TODO: await checkConsentRequired(email);
      if (consentRequired) {
          setLoginState(LoginState.AWAITING_PROCESSING_AGREEMENT);
      } else {
        sendLoginCode(uun).then(() => {
          setLoginState(LoginState.AWAITING_CODE_INPUT);
        }).catch((err) => {
          setLoginState(LoginState.AWAITING_UUN_INPUT);
          setError(err);
        });
      }
    } catch (err) {
      let message = "";
      if (err instanceof Error) message = err.message;
      if (typeof err === "string") message = err;
      setLoginState(LoginState.AWAITING_UUN_INPUT);
      setError(message);
    }
  };

  const handleProcessingAgreement: FormEventHandler<HTMLFormElement> = async e => {
    e.preventDefault();
    if (!processingAgreement) {
      setLoginState(LoginState.AWAITING_UUN_INPUT);
      setError("Exam Collection cannot sign you in without your consent.")
      return;
    }

    setLoginState(LoginState.PROCESSING);
    sendLoginCode(uun).then(() => {
      setLoginState(LoginState.AWAITING_CODE_INPUT);
    }).catch((err) => {
      setLoginState(LoginState.AWAITING_UUN_INPUT);
      setError(err);
    });
  }

  const changeUUN = () => {
    setError("");
    setLoginState(LoginState.AWAITING_UUN_INPUT);
  }

  const handleSubmitCode: FormEventHandler<HTMLFormElement> = e => {
    e.preventDefault();
    setError("");
    setLoginState(LoginState.PROCESSING);
    verifyLoginCode(uun, verificationCode).then(() => {
      // If there is a ?rd query parameter for redirect url, redirect to it.
      window.location.replace(rd ?? "/");
    }).catch((err) => {
      setLoginState(LoginState.AWAITING_CODE_INPUT);
      setError(err);
    });
  };

  if (loginState === LoginState.PROCESSING) {
    return (
      <Flex
        align="center"
        justify="center"
        style={{
          textAlign: "left",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}>
        <Loader />
      </Flex>
    );
  }

  return (
    <>
      <Flex
        align="center"
        justify="center"
        style={{
          textAlign: "left",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}>
          {(loginState === LoginState.AWAITING_UUN_INPUT && (
            <div>
              <Title order={4} color="gray.0" size="1.75rem" weight={700} mb="md">Sign in to view</Title>
              <form onSubmit={handleSubmitUUN}>
                <TextInput
                  label="Edinburgh UUN"
                  placeholder="s0000000"
                  value={uun}
                  onChange={(e: any) => setUUN(e.currentTarget.value)}
                  required
                  autoFocus
                  error={error}
                  color="white"
                  styles={{ label: { color: "white" }, error: { minWidth: "100%", width: 0 } }}
                />
                <Button color="white" variant="outline" mt="sm" type="submit">
                  Next
                </Button>
              </form>
            </div>
          )) || (loginState === LoginState.AWAITING_PROCESSING_AGREEMENT && (
            <form onSubmit={handleProcessingAgreement}>
              <Text color="white" mt="md" style={{ minWidth: "100%", width: 0 }}>
                Do you consent to the processing (see our <Anchor href="/privacy-policy" color="lightblue">privacy policy</Anchor>) of your UUN and IP address? The UUN will be visible to other users on this site.
              </Text>
              <Text color="white" mt="md" style={{ minWidth: "100%", width: 0 }}>
                Selecting "Yes" will send a 6-digit verification code to your email.
              </Text>
              <Group>
                <Button color="white" variant="outline" mt="sm" mr="3rem" type="submit" onClick={() => setProcessingAgreement(false)}>
                  No
                </Button>
                <Button color="white" variant="outline" mt="sm" ml="3rem" type="submit" onClick={() => setProcessingAgreement(true)}>
                  Yes
                </Button>
              </Group>
            </form>
          )) || (loginState === LoginState.AWAITING_CODE_INPUT && (
            <form onSubmit={handleSubmitCode}>
              <Text color="white"
                      style={{ minWidth: "100%", width: 0 }}>
                A 6-digit verification code has been sent to your email: <br/>
                {uun}@ed.ac.uk (<span onClick={changeUUN} style={{ cursor: "pointer" }} className="text-info">change</span>).
              </Text>
              <PinInput
                mt="md"
                oneTimeCode
                length={6}
                value={verificationCode}
                required
                autoFocus
                onChange={(value: string) => setVerificationCode(value)}
                error={!!error} /* cast to boolean */
              />
              {error && (
                <Text
                  color="red"
                  style={{ minWidth: "100%", width: 0 }}
                  size="xs">
                  {error}
                </Text>
              )}
              <Button mt="md" color="white" variant="outline" type="submit">
                Sign in
              </Button>
            </form>
          ))}
      </Flex>
    </>
// =======
// import { Button, Flex, Text } from "@mantine/core";
// import React from "react";
// import { login } from "../api/fetch-utils";

// const LoginOverlay: React.FC<{}> = () => {
//   return (
//     <Flex
//       align="center"
//       justify="center"
//       style={{
//         position: "absolute",
//         top: 0,
//         left: 0,
//         right: 0,
//         bottom: 0,
//         textAlign: "center",
//       }}
//     >
//       <div>
//         <Text color="gray.0" size="1.75rem" weight={700} mb="md">
//           Please Sign in
//         </Text>
//         <Button
//           size="lg"
//           color="gray.0"
//           variant="outline"
//           onClick={() => login()}
//         >
//           Sign in with AAI
//         </Button>
//       </div>
//     </Flex>
// >>>>>>> upstream/master
  );
};
export default LoginOverlay;
