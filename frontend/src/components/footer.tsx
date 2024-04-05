import React from "react";
import {
  Anchor,
  Box,
  Container,
  Divider,
  Flex,
  Group,
  Text,
} from "@mantine/core";
import { IconBrandGit, IconHeartFilled } from "@tabler/icons-react";

interface FooterProps {
  logo: string;
  disclaimer: string;
  privacy: string;
}

const Footer: React.FC<FooterProps> = ({ logo, disclaimer, privacy }) => {
  return (
    <Box pt="md" pb="lg">
      <Container size="xl">
        <Divider my="md" />
        <Flex
          justify={{
            base: "center",
            sm: "space-between",
          }}
          direction={{
            base: "column",
            sm: "row",
          }}
          gap="sm"
          align="center"
        >
          <Text
            fw="bold"
            style={{
              flex: 1,
            }}
          >
            Made with
            <IconHeartFilled
              style={{
                position: "relative",
                top: 2,
                color: "red",
                margin: "0px 4px",
                height: "15px",
                width: "15px",
              }}
            />
            by volunteers at{" "}
            <Anchor
              fw="bold"
              href="https://vis.ethz.ch/"
              title="Verein der Informatikstudierenden an der ETH Zürich"
              c="blue"
            >
              VIS
            </Anchor>
          </Text>
          <img
            height={32}
            src={logo}
            style={{ filter: "brightness(0)" }}
            alt="Logo of the student organization"
          />
          <Group
            style={{
              flex: 1,
              justifyContent: "flex-end",
            }}
          >
            <Anchor
              href="https://gitlab.ethz.ch/vseth/sip-com-apps/community-solutions"
              c="blue"
            >
              <IconBrandGit
                style={{
                  position: "relative",
                  top: 2,
                  marginRight: 6,
                  height: "15px",
                  width: "15px",
                }}
              />
              Repository
            </Anchor>
            <Anchor href={disclaimer} c="blue">
              Imprint
            </Anchor>
            <Anchor href={privacy} c="blue">
              Privacy Policy
            </Anchor>
          </Group>
        </Flex>
      </Container>
    </Box>
  );
};

export default Footer;
