import React from "react";
import { Container, Flex } from "@mantine/core";
import { Outlet } from "react-router";
import { GuideSideBarLeft } from "../components/guide-sidebar-left";

const GuideArticlePage: React.FC = () => {
  return (
    <Container size="xl" flex={1}>
      <Flex
        direction={{ base: "column", sm: "row" }}
        justify="space-between"
        align="flex-start"
        gap="xs"
      >
        <GuideSideBarLeft />
        <Outlet />
      </Flex>
    </Container>
  );
};

export default GuideArticlePage;
