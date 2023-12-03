import * as React from "react";
import { ReactNode } from "react";
import {
  Burger,
  Container,
  createStyles,
  Group,
  Stack,
  useMantineTheme,
  Text,
} from "@mantine/core";

import { NavItem, translate } from "./GlobalNav";
import ExternalNavElement from "./ExternalNav";

const useStyles = createStyles((_theme, _params) => ({
  navbar: {
    minHeight: "3.5rem",
    color: "white",
    width: "100%",
    boxShadow: _theme.shadows.sm,
    [_theme.fn.largerThan("md")]: {
      display: "none",
    },
  },
  logoLine: {
    padding: "0.75rem 0",
  },
  logo: {
    filter: "invert() contrast(234234)",
    height: "2rem",
    paddingRight: "1.25rem",
  },
  title: {
    fontWeight: 400,
    fontSize: "1.25rem",
  },
  separator: {
    width: "3.152rem",
    border: "0.5px solid white",
  },
  verticalSeparator: {
    height: "1.25rem",
    border: "0.5px solid white",
  },
  mobileLanguage: {
    textTransform: "uppercase",
    cursor: "pointer",
  },
}));

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
  const { classes } = useStyles();

  const theme = useMantineTheme();
  const [opened, setOpened] = React.useState(false);

  return (
    <Container
      className={classes.navbar}
      fluid={true}
      sx={(theme: any) => {
        return {
          backgroundColor: "rgba(51,51,51)",
        };
      }}
    >
      <Group className={classes.logoLine} align="center" position="apart">
        <div style={{ display: "flex" }}>
          <img
            src={
              signet
                ? signet
                : "https://static.vseth.ethz.ch/assets/vseth-0000-vseth/signet-mono.svg"
            }
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
        <Stack align="left" spacing="sm" py="xs">
          {translate(appNav, selectedLanguage).map((item, i) => {
            return (
              <div key={i} onClick={() => setOpened(false)}>
                <ExternalNavElement
                  item={item}
                  lightBg={false}
                  mobile={true}
                  isExternal={false}
                />
              </div>
            );
          })}
          {languages ? (
            <Group>
              {languages.map((lang, i) => (
                <>
                  <Text
                    className={classes.mobileLanguage}
                    onClick={() => {
                      onLanguageSelect(lang.key);
                    }}
                  >
                    {lang.key}
                  </Text>
                  {i !== languages.length - 1 ? (
                    <div className={classes.verticalSeparator} />
                  ) : undefined}
                </>
              ))}
            </Group>
          ) : undefined}
          {loginButton}
        </Stack>
      ) : undefined}
    </Container>
  );
};

export default BottomHeader;
