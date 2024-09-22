import {
  ActionIcon,
  Button,
  Loader,
  Group,
  Flex,
  PinInput,
  Stack,
  TextInput,
  Title,
  Text,
  Tooltip,
  Anchor,
  Highlight,
} from "@mantine/core";
import { IconArrowRight } from "@tabler/icons-react";
import React, { FormEventHandler, useState } from "react";
import { sendLoginCode, verifyLoginCode } from "../api/fetch-utils";
import { useLocation } from "react-router-dom";

export enum LoginState {
  AWAITING_UUN_INPUT,
  AWAITING_PROCESSING_AGREEMENT,
  AWAITING_CODE_INPUT,
  PROCESSING,
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
        sendLoginCode(uun)
          .then(() => {
            setLoginState(LoginState.AWAITING_CODE_INPUT);
          })
          .catch(err => {
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

  const handleProcessingAgreement: FormEventHandler<
    HTMLFormElement
  > = async e => {
    e.preventDefault();
    if (!processingAgreement) {
      setLoginState(LoginState.AWAITING_UUN_INPUT);
      setError("BetterInformatics cannot sign you in without your consent.");
      return;
    }

    setLoginState(LoginState.PROCESSING);
    sendLoginCode(uun)
      .then(() => {
        setLoginState(LoginState.AWAITING_CODE_INPUT);
      })
      .catch(err => {
        setLoginState(LoginState.AWAITING_UUN_INPUT);
        setError(err);
      });
  };

  const changeUUN = () => {
    setError("");
    setLoginState(LoginState.AWAITING_UUN_INPUT);
  };

  const handleSubmitCode: FormEventHandler<HTMLFormElement> = e => {
    e.preventDefault();
    setError("");
    setLoginState(LoginState.PROCESSING);
    verifyLoginCode(uun, verificationCode)
      .then(() => {
        // If there is a ?rd query parameter for redirect url, redirect to it.
        window.location.replace(rd ?? "/");
      })
      .catch(err => {
        setLoginState(LoginState.AWAITING_CODE_INPUT);
        setError(err);
      });
  };

  if (loginState === LoginState.PROCESSING) {
    return (
      <Flex align="center" justify="center">
        <Loader />
      </Flex>
    );
  }

  return (
    <Stack gap="xs">
      {(loginState === LoginState.AWAITING_UUN_INPUT && (
        <>
          <Title order={4} size="1.75rem" fw={700} mb="md">
            Sign in to view
          </Title>
          {rd && (
            <Text size="xs" mb="xs">
              <Highlight highlight={rd}>
                {`The content at ${rd} is only available to University of Edinburgh students. Please sign in to view.`}
              </Highlight>
            </Text>
          )}
          <form onSubmit={handleSubmitUUN}>
            <TextInput
              label="Edinburgh UUN"
              placeholder="s0000000"
              value={uun}
              onChange={(e: any) => setUUN(e.currentTarget.value)}
              required
              autoFocus
              error={error}
              rightSection={
                <Tooltip withinPortal label="Login">
                  <ActionIcon type="submit">
                    <IconArrowRight />
                  </ActionIcon>
                </Tooltip>
              }
            />
          </form>
        </>
      )) ||
        (loginState === LoginState.AWAITING_PROCESSING_AGREEMENT && (
          <form onSubmit={handleProcessingAgreement}>
            <Text mt="md">
              Do you consent to the processing (see our{" "}
              <Anchor href="/privacy" color="blue">
                privacy policy
              </Anchor>
              ) of your UUN and IP address? The UUN will be visible to other
              users on this site.
            </Text>
            <Text mt="md">
              Selecting "Yes" will send a 6-digit verification code to your
              email.
            </Text>
            <Group justify="space-between">
              <Button
                variant="outline"
                mt="sm"
                type="submit"
                onClick={() => setProcessingAgreement(false)}
              >
                No
              </Button>
              <Button
                variant="outline"
                mt="sm"
                type="submit"
                onClick={() => setProcessingAgreement(true)}
              >
                Yes
              </Button>
            </Group>
          </form>
        )) ||
        (loginState === LoginState.AWAITING_CODE_INPUT && (
          <form onSubmit={handleSubmitCode}>
            <Text>
              A 6-digit verification code has been sent to your email: <br />
              {uun}@sms.ed.ac.uk (
              <span
                onClick={changeUUN}
                style={{ cursor: "pointer" }}
                className="text-info"
              >
                change
              </span>
              ).
            </Text>
            <PinInput
              mt="md"
              size="md"
              oneTimeCode
              length={6}
              value={verificationCode}
              hiddenInputProps={{ required: true }}
              autoFocus
              type="number"
              onChange={(value: string) => setVerificationCode(value)}
              error={!!error} /* cast to boolean */
              style={{ display: "flex", justifyContent: "center" }}
            />
            {error && (
              <Text c="red" size="xs">
                {error}
              </Text>
            )}
            <Button mt="md" fullWidth variant="outline" type="submit">
              Sign in
            </Button>
          </form>
        ))}
    </Stack>
  );
};
export default LoginOverlay;
