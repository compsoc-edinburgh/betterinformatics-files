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
          gap="md"
          align="center"
        >
          <img height={32} src={logo} alt="Logo of the student organization" />
          <Text
            style={{
              flex: 1,
            }}
          >
            Orginal software (GPL) built with
            <Icon
              icon={ICONS.LIKE_FILLED}
              color="darkred"
              aria-label="love"
              style={{
                position: "relative",
                top: 2,
                margin: "0px 4px",
              }}
            />
            by volunteers at{" "}
            <Anchor
              href="https://vis.ethz.ch/"
              title="Verein der Informatikstudierenden an der ETH Zürich"
              color="blue"
            >
              VIS ETH Zurich
            </Anchor>
            <br />
            Modified and deployed with
            <Icon
              icon={ICONS.LIKE_FILLED}
              color="darkred"
              aria-label="love"
              style={{
                position: "relative",
                top: 2,
                margin: "0px 4px",
              }}
            />
            by volunteers at{" "}
            <Anchor
              href="http://comp-soc.com"
              title="Computing Society at the University of Edinburgh"
              color="blue"
            >
              CompSoc
            </Anchor>
          </Text>
          <Group
            style={{
              flex: 1,
              justifyContent: "flex-end",
            }}
          >
            <Anchor
              href="https://git.tardisproject.uk/kilo/edinburgh-community-solutions"
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
              Disclaimer
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
