import { Container, em, Group, SimpleGrid} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import React from "react";

const ThreeGrid: React.FC<{
  first?: React.ReactNode;
  second?: React.ReactNode;
  third?: React.ReactNode;
}> = ({ first, second, third}) => {
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`);
  const variant = isMobile ? "rows" : "cols";
  return variant === "cols" ? (
    <Container fluid px={0}>
      <SimpleGrid cols={3}>
        <Group justify="left">{first}</Group>
        <Group justify="center">{second}</Group>
        <Group justify="right">{third}</Group>
      </SimpleGrid>
    </Container>
  ) : 
  (
    <Container fluid px={0}>
      <SimpleGrid cols={1}>
        {[first, second, third].filter((elem) => elem).map((elem, index) => (
          <Group grow key={index}>{elem}</Group>
        ))}
      </SimpleGrid>
    </Container>
  );
};
export default ThreeGrid;
