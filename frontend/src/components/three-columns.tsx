import { Container, Group, SimpleGrid } from "@mantine/core";
import React from "react";

const ThreeColumns: React.FC<{
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
}> = ({ left, center, right }) => {
  return (
    <Container fluid px={0}>
      <SimpleGrid cols={3}>
        <Group justify="left">{left}</Group>
        <Group justify="center">{center}</Group>
        <Group justify="right">{right}</Group>
      </SimpleGrid>
    </Container>
  );
};
export default ThreeColumns;
