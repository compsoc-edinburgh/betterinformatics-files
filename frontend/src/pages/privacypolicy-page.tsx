import * as React from "react";
import useTitle from "../hooks/useTitle";
import serverData from "../utils/server-data";
import { Title, Container } from "@mantine/core";

export const PrivacyPolicyPage: React.FC = () => {
  useTitle("Privacy Policy");

  return (
    <Container size="xl">
      <Title order={1} mb="md">
        Privacy Policy
      </Title>
      <Title order={2}>Our Contact Details</Title>
      <p>
        <b>Name: </b> CompSoc BetterInformatics <br />
        <b>Address: </b> CompSoc, School of Informatics, Informatics Forum, 10
        Crichton Street, Edinburgh, EH8 9AB. <br />
        <b>Email: </b>{" "}
        <a href={`mailto:${serverData.email_address}`}>
          {serverData.email_address}
        </a>
      </p>

      <Title order={2}>Types of personal information collected</Title>
      <p>
        We currently collect and process the following information:
        <ul>
          <li>Student UUN (i.e. username)</li>
          <li>IP Address (stored ephemeraly during login)</li>
        </ul>
      </p>

      <Title order={2}>
        How we get the personal information and why we have it
      </Title>
      <p>
        All of the personal information we process is provided to us directly by
        you for authentication and identification purposes.
      </p>
      <p>
        We use the information that you have given us in order to limit access
        to the exam collection and its answers to current University of
        Edinburgh students.
      </p>
      <p>
        Under the UK General Data Protection Regulation (UK GDPR), the lawful
        bases we rely on for processing this information are:
        <ul>
          <li>
            Your consent. You are able to remove your consent at any time. You
            can do this by contacting us at{" "}
            <a href={`mailto:${serverData.email_address}`}>
              {serverData.email_address}
            </a>
            to request the deletion of your account.
          </li>
        </ul>
      </p>

      <Title order={2}>How we store your personal information</Title>
      <p>
        Your student UUN and any contributed data are securely stored on our
        servers hosted in Edinburgh by the Tardis Project. We will keep these
        until you request the deletion of your account.
      </p>
      <p>
        Your IP address is only stored ephemerally during the login request in
        order to email the verification code to the associated email. This info
        is used to track down any malicious attempts to login to your account.
      </p>

      <Title order={2}>Your data protection rights</Title>
      <p>
        Under data protection law, you have rights including:
        <ul>
          <li>
            <b>Your Right of Access</b> - You have the right to ask us for
            copies of your personal information.
          </li>
          <li>
            <b>Your Right to Erasure</b> - You have the right to ask us to erase
            your personal information.
          </li>
          <li>
            <b>Your Right to Restrict Processing</b> - You have the right to ask
            us to restrict the processing of your personal information.
          </li>
          <li>
            <b>Your Right to Object to Processing</b> - You have the right to
            object to the processing of your personal information.
          </li>
        </ul>
        You are not required to pay any charge for exercising your rights. If
        you make a request, we have one month to respond to you. Please contact
        us at{" "}
        <a href={`mailto:${serverData.email_address}`}>
          {serverData.email_address}
        </a>
      </p>

      <Title order={2}>How to complain</Title>
      <p>
        If you have any concerns about our use of your personal information, you
        can make a complaint to us at{" "}
        <a href={`mailto:${serverData.email_address}`}>
          {serverData.email_address}
        </a>
      </p>
    </Container>
  );
};
export default PrivacyPolicyPage;
