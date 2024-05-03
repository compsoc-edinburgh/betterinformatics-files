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
import { useLocalStorageState } from "@umijs/hooks";
import { IconBrandGit, IconHeartFilled } from "@tabler/icons-react";

interface FooterProps {
  logo: string;
  disclaimer: string;
  privacy: string;
}

const Footer: React.FC<FooterProps> = ({ logo, disclaimer, privacy }) => {
  const [uwu, setLocalUwu] = useLocalStorageState("uwu", false);
  const setUwu = () => {
    setLocalUwu(!uwu);
    window.location.reload();
  };
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
            <IconHeartFilled
              style={{
                position: "relative",
                top: 2,
                color: "darkred",
                margin: "0px 4px",
                height: "15px",
                width: "15px",
              }}
            />
            by volunteers at{" "}
            <Anchor
              href="https://vis.ethz.ch/"
              title="Verein der Informatikstudierenden an der ETH Zürich"
              c="blue"
            >
              VIS ETH Zurich
            </Anchor>
            <br />
            Modified and deployed with
            <IconHeartFilled
              style={{
                position: "relative",
                top: 2,
                color: "darkred",
                margin: "0px 4px",
                height: "15px",
                width: "15px",
              }}
            />
            by volunteers at{" "}
            <Anchor
              href="http://comp-soc.com"
              title="Computing Society at the University of Edinburgh"
              c="blue"
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
            <Anchor onClick={setUwu} c="blue">uwu?</Anchor>
            <Anchor href={disclaimer} c="blue">
              Disclaimer
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
