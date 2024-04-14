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

interface Props {
  selectedLanguage: "en" | "de" | string;
  languages?: { key: string; label: string }[];
  onLanguageSelect: (language: string) => void;
  appNav: NavItem[];
  title: string;
  loginButton?: ReactNode;
  signet?: string;
}
const BottomHeader: React.FC<Props> = ({
  selectedLanguage,
  onLanguageSelect,
  languages,
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
            src={signet}
            alt="Signet of the student organization"
            className={classes.logo}
          />
          <div className={classes.title}>
            <a style={{ color: "inherit", textDecoration: "none" }} href="/">
              {title}
            </a>
          </div>
        </div>

        <Burger
          opened={opened}
          onClick={() => setOpened((o: boolean) => !o)}
          size="sm"
          color={theme.colors.gray[0]}
        />
      </Group>
      {opened ? (
        <Stack align="flex-start" gap="sm" py="xs">
          {translate(appNav, selectedLanguage).map((item, i) => {
            return (
              <div key={i} onClick={() => setOpened(false)}>
                <ExternalNavElement
                  item={item}
                  mobile={true}
                  isExternal={false}
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
