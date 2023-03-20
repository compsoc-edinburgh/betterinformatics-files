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
        <Group position="left">
          {left}
        </Group>
        <Group position="center">
          {center}
        </Group>
        <Group position="right">
          {right}
        </Group>
      </SimpleGrid>
    </Container>
  );
};
export default ThreeColumns;
