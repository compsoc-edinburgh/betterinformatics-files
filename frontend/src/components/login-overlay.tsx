import { Button, FormGroup, Form, Label, Input, Spinner } from "@vseth/components";
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
      <div className="position-center text-white">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <div className="text-left position-cover d-flex align-items-center justify-content-center">
          {(loginState === LoginState.AWAITING_UUN_INPUT && (
            <div>
              <h4 className="mb-4 font-weight-bold text-white">Sign in to view</h4>
              <Form onSubmit={handleSubmitUUN}>
                <FormGroup className="m-1">
                  <Label for="login-email" className="text-white">
                    Edinburgh UUN:
                  </Label>
                  <Input
                    name="login-uun"
                    type="text"
                    className="login-uun"
                    placeholder="s0000000"
                    value={uun}
                    onChange={e => setUUN(e.currentTarget.value)}
                    required
                    autoFocus />
                  {error && (
                    <p
                      className="text-danger mb-0"
                      style={{ minWidth: "100%", width: 0 }}>
                      {error}
                    </p>
                  )}
                  <Button className="mt-3" size="lg" color="white" outline type="submit">
                    Next
                  </Button>
                </FormGroup>
              </Form>
            </div>
          )) || (loginState === LoginState.AWAITING_PROCESSING_AGREEMENT && (
            <Form onSubmit={handleProcessingAgreement}>
              <p className="text-white mt-3" style={{ minWidth: "100%", width: 0 }}>
                Do you consent to the processing (see our <a href="/privacy-policy" className="text-info">privacy policy</a>) of your UUN and IP address? This is personally identifiable information.
              </p>
              <p className="text-white mt-3" style={{ minWidth: "100%", width: 0 }}>
                Selecting "Yes" will send a 6-digit verification code to your email.
              </p>
              <FormGroup className="m-1">
                <Button className="mr-5" size="lg" color="white" outline type="submit" onClick={() => setProcessingAgreement(false)}>
                  No
                </Button>
                <Button className="ml-4" size="lg" color="white" outline type="submit" onClick={() => setProcessingAgreement(true)}>
                  Yes
                </Button>
              </FormGroup>
            </Form>
          )) || (loginState === LoginState.AWAITING_CODE_INPUT && (
            <Form onSubmit={handleSubmitCode}>
              <p className="text-white mt-3" 
                      style={{ minWidth: "100%", width: 0 }}>
                A 6-digit verification code has been sent to your email: <br/>
                {uun}@ed.ac.uk (<span onClick={changeUUN} style={{ cursor: "pointer" }} className="text-info">change</span>).
              </p>
              <FormGroup className="m-1">
                <Label for="login-code" className="text-white">
                  6-digit Code:
                </Label>
                <Input
                  name="login-code"
                  type="number"
                  pattern="[0-9]{6}" // fallback in case type="number" is too new
                  autoComplete="one-time-code"
                  className="login-code"
                  value={verificationCode}
                  required
                  autoFocus
                  onChange={e => setVerificationCode(e.currentTarget.value)} />
                  {error && (
                    <p
                      className="text-danger mb-0"
                      style={{ minWidth: "100%", width: 0 }}>
                      {error}
                    </p>
                  )}
                <Button className="mt-3" size="lg" color="white" outline type="submit">
                  Sign in
                </Button>
              </FormGroup>
            </Form>
          ))}
      </div>
    </>
  );
};
export default LoginOverlay;
