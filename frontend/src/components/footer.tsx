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
import { Icon, ICONS } from "vseth-canine-ui";

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
            <Icon
              icon={ICONS.LIKE_FILLED}
              color="red"
              aria-label="love"
              style={{
                position: "relative",
                top: 2,
                margin: "0px 4px",
              }}
            />
            by volunteers at{" "}
            <Anchor
              href="http://vis.ethz.ch/"
              title="Verein der Informatik Studierenden an der ETH Zürich"
              color="blue"
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
              color="blue"
            >
              <Icon
                icon={ICONS.GITLAB}
                style={{
                  position: "relative",
                  top: 2,
                  marginRight: 6,
                }}
              />
              Repository
            </Anchor>
            <Anchor href={disclaimer} color="blue">
              Imprint
            </Anchor>
            <Anchor href={privacy} color="blue">
              Privacy Policy
            </Anchor>
          </Group>
        </Flex>
      </Container>
    </Box>
  );
};

export default Footer;
