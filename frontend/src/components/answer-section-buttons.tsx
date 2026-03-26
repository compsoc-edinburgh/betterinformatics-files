import { Container, em, Group, SimpleGrid, Flex } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import React from "react";

const AnswerSectionButtons: React.FC<{
  visibility?: React.ReactNode;
  cancel_add?: React.ReactNode;
  show_hide?: React.ReactNode;
  move?: React.ReactNode;
}> = ({ visibility, cancel_add, show_hide, move }) => {
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`);
  const variant = isMobile ? "rows" : "cols";
  return variant === "cols" ? (
    <Flex px={0} align="center" gap="xs">
      {visibility}
      <SimpleGrid cols={3} flex={1}>
        <Group justify="left">{cancel_add}</Group>
        <Group justify="center">{show_hide}</Group>
        <Group justify="right">{move}</Group>
      </SimpleGrid>
    </Flex>
  ) : (
    <Container fluid px={0}>
      {visibility}
      <SimpleGrid cols={1}>
        {[cancel_add, show_hide, move]
          .filter(elem => elem)
          .map((elem, index) => (
            <Group grow key={index}>
              {elem}
            </Group>
          ))}
      </SimpleGrid>
    </Container>
  );
};
export default AnswerSectionButtons;
