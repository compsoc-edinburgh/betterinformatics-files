import React, { Suspense } from "react";
import {
  Anchor,
  Container,
  Drawer,
  Flex,
  Group,
  Loader,
  Paper,
  Portal,
} from "@mantine/core";
import { Outlet } from "react-router";
import { GuideSideBarLeft } from "../components/guide-sidebar-left";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { IconArrowsVertical } from "@tabler/icons-react";

const GuideArticlePage: React.FC = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const isLargerThanSm = useMediaQuery("(min-width: 48em)");

  return (
    <Container size="xl" flex={1}>
      <Flex
        direction={{ base: "column", sm: "row" }}
        justify="space-between"
        align={{ base: "stretch", sm: "flex-start" }}
        gap="xs"
      >
        {isLargerThanSm ? (
          <GuideSideBarLeft />
        ) : (
          <Portal>
            <Drawer
              opened={opened}
              onClose={close}
              withCloseButton={false}
              size="xs"
              position="bottom"
            >
              <GuideSideBarLeft />
            </Drawer>
            <Anchor
              component="button"
              onClick={open}
              pos="fixed"
              bottom={0}
              left={0}
              w="100%"
              td="none"
            >
              <Paper
                shadow="xs"
                radius={0}
                p="xs"
                bg="var(--mantine-color-body)"
              >
                <Group gap="xs" justify="center">
                  <IconArrowsVertical size={16} />
                  List all guides
                </Group>
              </Paper>
            </Anchor>
          </Portal>
        )}
        <Suspense fallback={<Loader />}>
          <Outlet />
        </Suspense>
      </Flex>
    </Container>
  );
};

export default GuideArticlePage;
