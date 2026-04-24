import * as React from "react";
import { Container } from "@mantine/core";
import { changelogSource } from "../utils/changelog";
import MarkdownText from "../components/markdown-text";
import useTitle from "../hooks/useTitle";

const ChangelogPage: React.FC = () => {
  useTitle("What's New");

  return (
    <Container size="xl">
      <MarkdownText value={changelogSource} />
    </Container>
  );
};

export default ChangelogPage;
