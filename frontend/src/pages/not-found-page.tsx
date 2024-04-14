import { Container, Text, Title } from "@mantine/core";
import React from "react";
import useTitle from "../hooks/useTitle";

const NotFoundPage: React.FC<{}> = () => {
  useTitle("404");
  return (
    <Container size="xl">
      <Title c="dimmed" mb="xl" style={{ fontSize: 150 }}>
        404 Not Found.
      </Title>
      <Text mb="xl">
        No need to freak out. Maybe you want to double-check whether you entered
        the URL correctly?
      </Text>
    </Container>
  );
};
export default NotFoundPage;
