import { Container, Flex, Grid, Paper, Text } from "@mantine/core";
import React from "react";
import { useLocation } from "react-router-dom";
import LoginOverlay from "../components/login-overlay";
import useTitle from "../hooks/useTitle";
import { useUser } from "../auth";
import { CategoryList } from "./home-page";

const LoginPage: React.FC<{ isHome: boolean }> = ({ isHome = false }) => {
  useTitle("Login");
  const user = useUser();
  const rd = new URLSearchParams(useLocation().search).get("rd");

  if (user !== undefined && user.loggedin) {
    // If the user is already logged in, redirect them to the home page or what
    // they were trying to access.
    window.location.replace(rd ?? "/");
    return null;
  }
  return (
    <>
      <Container size="xl" mb="xl">
        <Grid gutter="xl">
          <Grid.Col
            xs={12}
            md={6}
            lg={6}
            xl={6}
            style={{ alignSelf: "center" }}
          >
            <Flex direction="column" justify="center">
              <Text size="4rem" lh={1} mt="lg">
                Better&shy;Informatics
              </Text>
              <Text size="2.5rem" lh={1.2} my="lg">
                File Collection
              </Text>
              <Text size="1rem" weight={500}>
                BetterInformatics File Collection is a platform for students to
                share notes, summaries, tips and recommendations for courses, as
                well as a study platform to collaborate on answers to previous
                exams.
              </Text>
            </Flex>
          </Grid.Col>
          <Grid.Col
            xs={12}
            md={6}
            offset={0}
            lg={5}
            offsetLg={1}
            xl={4}
            offsetXl={2}
            mx="auto"
            py="sm"
          >
            <Paper withBorder shadow="sm" p={30} mt={30} radius="md">
              <LoginOverlay />
            </Paper>
          </Grid.Col>
        </Grid>
      </Container>
      {isHome && <CategoryList />}
    </>
  );
};
export default LoginPage;
