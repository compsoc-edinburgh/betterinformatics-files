import * as React from "react";
import useTitle from "../hooks/useTitle";
import serverData from "../utils/server-data";
import { Title, Container } from "@mantine/core";

export const DisclaimerPage: React.FC = () => {
  useTitle("Disclaimer");

  return (
    <Container size="xl">
      <Title order={1} mb="md">
        Disclaimers
      </Title>
      <Title order={2}>Legal Disclaimer</Title>
      <p>
        The Exam Collection is not affiliated with the University of Edinburgh,
        but is a student project run by volunteers within CompSoc, the UoE
        Technology society. The platform is neither endorsed nor supported by
        the University of Edinburgh.
      </p>
      <p>
        CompSoc BetterInformatics Exam Collection is a platform designed to
        facilitate collaborative learning by providing existing University of
        Edinburgh students with access to past papers and community-contributed
        answers. The past papers mirror those published on the Exam Papers
        Online, an independent service provided by University of Edinburgh
        Library and University Collections for the purpose of study aid. Access
        to the past papers both on Exam Papers Online and on our Exam Collection
        is restricted to current University of Edinburgh students only (via
        email authentication).
      </p>
      <p>
        We do not endorse any use of past papers outside of its intended purpose
        of study aid for our users. The Exam Collection may ban access to the
        service for users who do not respect these violate engage in any form of
        academic dishonesty.
      </p>

      <Title order={2}>External Links</Title>
      <p>
        We do not claim any responsibility for external references and website
        links. Access to and use of such websites is at the user's own risk.
      </p>

      <Title order={2}>Past Paper Takedown</Title>
      <p>
        If you are a member of the University of Edinburgh staff and would like
        to request the removal of a past paper or any of its community-provided
        answers from the Exam Collection, please contact us at{" "}
        <a href={`mailto:${serverData.email_address}`}>
          {serverData.email_address}
        </a>
        . You may also want to separately contact Exam Papers Online to request
        the removal of the original past paper.
      </p>

      <Title order={2}>License and Copyright</Title>
      <p>
        The past papers available on the Exam Collection belong to the
        University of Edinburgh.
      </p>
      <p>
        The community-provided answers are licensed under the Creative Commons
        Attribution-NonCommercial-ShareAlike 4.0 International License.
      </p>
      <p>
        The source code for the Exam Collection is available under the GNU GPL
        v3 license.
      </p>
    </Container>
  );
};
export default DisclaimerPage;
