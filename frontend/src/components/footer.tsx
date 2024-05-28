import React, { ReactNode } from "react";
import {
  Anchor,
  Box,
  Container,
  Divider,
  Flex,
  Group,
  Space,
  Text,
  Title,
  rem,
} from "@mantine/core";
import { useLocalStorageState } from "@umijs/hooks";
import { IconHeartFilled } from "@tabler/icons-react";
import { NavItem, globalNav, translate } from "./Navbar/GlobalNav";

interface FooterProps {
  logo: string;
  disclaimer: string;
  privacy: string;
  organizationNav: NavItem[];
}

const Footer: React.FC<FooterProps> = ({ logo, disclaimer, privacy, organizationNav }) => {
  const [uwu, setLocalUwu] = useLocalStorageState("uwu", false);
  const setUwu = () => {
    setLocalUwu(!uwu);
    window.location.reload();
  };

  return (
    <Box pt="md" pb="lg">
      <Container size="xl">
        <Divider my="md" />
        <Flex justify="space-between" direction={{ base: "column", md: "row" }} rowGap="xl" pt="lg">
          <Flex direction="column" align="start" justify="start">
            <Anchor href="https://betterinformatics.com" underline="never">
              <Group>
                <img height={32} src={logo} alt="Logo of the student organization" />
                <Text>Better Informatics</Text>
              </Group>
            </Anchor>
            <Text size="xs" c="gray" mt="md">
              Original software (GPL) built with
              <IconHeartFilled
                style={{
                  position: "relative",
                  top: 2,
                  color: "var(--mantine-color-pink-5)",
                  margin: "0px 4px",
                  height: "10px",
                  width: "10px",
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
              Modified and deployed on{" "}
              <Anchor
                href="https://tardisproject.uk"
                title="Tardis Project"
                c="blue"
              >
                Tardis
              </Anchor>
              {" "}with
              <IconHeartFilled
                style={{
                  position: "relative",
                  top: 2,
                  color: "var(--mantine-color-pink-5)",
                  margin: "0px 4px",
                  height: "10px",
                  width: "10px",
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
          </Flex>
          <Group align="start">
            {translate(
              organizationNav ? organizationNav : globalNav,
              "en",
            ).map((item, i) => (
              <Flex justify="flex-start" direction="column" style={{ width: rem(160) }}>
                <Title order={4} c="gray">{item.title as ReactNode}</Title>
                <Space h="xs" />
                {item.childItems?.map((childItem, i) => (
                  <Anchor
                    onClick={childItem.title === "uwu?" ? setUwu : undefined}
                    href={childItem.href}
                    key={i}
                    c="gray"
                  >
                    {childItem.title as ReactNode}
                  </Anchor>
                ))}
              </Flex>
            ))}
          </Group>
        </Flex>
      </Container>
    </Box>
  );
};

export default Footer;
