import * as React from "react";
import { ReactNode } from "react";
import {
  Burger,
  Container,
  Group,
  Stack,
  useMantineTheme,
  Text,
} from "@mantine/core";

import { NavItem, translate } from "./GlobalNav";
import ExternalNavElement from "./ExternalNav";
import classes from "./MobileHeader.module.css";
import ColorSchemeToggle from "../color-scheme-toggle";

interface Props {
  selectedLanguage: "en" | "de" | string;
  appNav: NavItem[];
  title: string;
  loginButton?: ReactNode;
  signet?: string;
}
const BottomHeader: React.FC<Props> = ({
  selectedLanguage,
  appNav,
  title,
  loginButton,
  signet,
}) => {
  const theme = useMantineTheme();
  const [opened, setOpened] = React.useState(false);

  return (
    <Container
      hiddenFrom="md"
      className={classes.navbar}
      fluid={true}
      style={{ backgroundColor: "rgba(51,51,51)" }}
    >
      <Group
        className={classes.logoLine}
        align="center"
        justify="space-between"
      >
        <div style={{ display: "flex" }}>
          <img
            src={
              signet
                ? signet
                : "https://static.vseth.ethz.ch/assets/vseth-0000-vseth/signet-mono.svg"
            }
            alt="Signet of the student organization"
            className={classes.logo}
          />
          <div className={classes.title}>
            <a style={{ color: "inherit", textDecoration: "none" }} href="/">
              {title}
            </a>
          </div>
        </div>
        <Group>
          <ColorSchemeToggle />
          <Burger
            opened={opened}
            onClick={() => setOpened((o: boolean) => !o)}
            size="sm"
            color={theme.colors.gray[0]}
          />
        </Group>
      </Group>
      {opened ? (
        <Stack align="left" gap="sm" py="xs">
          {translate(appNav, selectedLanguage).map((item, i) => {
            return (
              <div key={i} onClick={() => setOpened(false)}>
                <ExternalNavElement
                  item={item}
                  mobile={true}
                  isExternal={false}
                  titleClassName={classes.navItem}
                />
              </div>
            );
          })}
          {loginButton}
        </Stack>
      ) : undefined}
    </Container>
  );
};

export default BottomHeader;
