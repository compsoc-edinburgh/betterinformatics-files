import { Container, Grid, Text, Title } from "@mantine/core";
import React from "react";
import useTitle from "../hooks/useTitle";
import Bjoern from "../assets/bjoern.svg?react";

const NotFoundPage: React.FC<{}> = () => {
  useTitle("404");
  return (
    <Container size="xl">
      <Grid>
        <Grid.Col span={{ sm: 9, md: 8, lg: 6 }}>
          <Title mb="sm">This is a 404.</Title>
          <Text>
            No need to freak out. Did you enter the URL correctly? For this
            inconvenience, have this drawing of Björn:
          </Text>
        </Grid.Col>
        <Grid.Col span={{ sm: 9, md: 8, lg: 6 }}>
          <Bjoern />
        </Grid.Col>
      </Grid>
    </Container>
  );
};
export default NotFoundPage;
