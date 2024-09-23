import { Container, Flex, Grid, Paper, Text } from "@mantine/core";
import React from "react";
import { useLocalStorageState } from "@umijs/hooks";
import { useLocation } from "react-router-dom";
import LoginOverlay from "../components/login-overlay";
import useTitle from "../hooks/useTitle";
import { useUser } from "../auth";
import { CategoryList } from "./home-page";
import KawaiiBetterInformatics from "../assets/kawaii-betterinformatics.svg?react";

const LoginPage: React.FC<{ isHome: boolean }> = ({ isHome = false }) => {
  useTitle("Login");
  const user = useUser();
  const rd = new URLSearchParams(useLocation().search).get("rd");
  const [uwu, _] = useLocalStorageState("uwu", false);

  if (user !== undefined && user.loggedin) {
    // If the user is already logged in, redirect them to the home page or what
    // they were trying to access.
    window.location.replace(rd ?? "/");
    return null;
  }

  return (
    <>
      <Container size="xl" mb="lg">
        <Grid gutter="xl">
          <Grid.Col
            span={{ base: 12, md: 6, lg: 6, xl: 6 }}
          >
            <Flex direction="column" justify="center">
              {uwu ? (
                <KawaiiBetterInformatics />
              ) : (
                <>
                  <Text size="4rem" lh={1} mt="lg">
                    Better&shy;Informatics
                  </Text>
                  <Text size="2.5rem" lh={1.2} my="lg">
                    File Collection
                  </Text>
                </>
              )}
              <Text fw={500}>
                BetterInformatics File Collection is a platform for students to
                share notes, summaries, tips and recommendations for courses, as
                well as a study platform to collaborate on answers to previous
                exams.
              </Text>
            </Flex>
          </Grid.Col>
          <Grid.Col
            span={{ base: 12, md: 6, lg: 5, xl: 4 }}
            offset={{ base: 0, lg: 1, xl: 2 }}
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
