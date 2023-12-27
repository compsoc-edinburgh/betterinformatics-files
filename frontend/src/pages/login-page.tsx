import { Container, Flex, Grid, Text } from "@mantine/core";
import React from "react";
import LoginOverlay from "../components/login-overlay";
import useTitle from "../hooks/useTitle";
import { CategoryList } from "./home-page";

const LoginPage: React.FC<{ isHome: boolean }> = ({ isHome = false }) => {
  useTitle("Login");
  return (
    <>
      <Container size="xl">
        <Grid>
          <Grid.Col
            xs={12}
            md={6}
            lg={7}
            xl={8}
            style={{ alignSelf: "center" }}>
            <Flex direction="column" justify="center">
              <Text size="4.5rem" lh={1} mt="lg">
                Better&shy;Informatics
              </Text>
              <Text size="2.5rem" lh={1.2} my="lg">
                Exam Collection
              </Text>
              <Text size="1rem" weight={500}>
              The BI Exam Collection is a platform for students to share answers
              for previous exams, leave comments on answers, and upload other
              relevant documents.
              </Text>
            </Flex>
          </Grid.Col>
          <Grid.Col
            xs={12}
            md={6}
            lg={5}
            xl={4}
            mx="auto"
            py="sm"
            style={{ position: "relative" }}
          >
            <Flex align="center">
            <svg
              x="0px" y="0px"
              viewBox="0 0 200 200"
              xmlns="http://www.w3.org/2000/svg"
              style={{"margin": "auto"}}
              color="gray.0"
            >
              <path
                d="M146.9,18.7c15.7,0.8,32.3,8.2,30.9,29.7c-1.4,22.2,7.7,33.5,7.4,68.9c-0.1,16.3-1.8,34.1-3.3,37
                c-6.4,12.3-19,18.7-33.6,20.1c-8.2,0.8-19.9-2.5-33.9-7s-28.6,1.3-41.5,7.2c-12.9,6-43.9,4.6-49.9-5.3c-6.1-9.9,3.9-27.2,7-48.5
                c2.4-16.4-7.7-42.7-2.9-64c8-36,31.3-35,35.6-35c5.6,0,24.7,4.1,39.7,4.3C128.4,26.5,134.5,18,146.9,18.7z"
              />
            </svg>
              <LoginOverlay />
            </Flex>
          </Grid.Col>
        </Grid>
      </Container>
      {isHome && <CategoryList />}
    </>
  );
};
export default LoginPage;
