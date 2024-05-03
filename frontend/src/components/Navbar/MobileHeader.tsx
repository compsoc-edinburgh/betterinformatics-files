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
import { useLocalStorageState } from "@umijs/hooks";
import { NavItem, translate } from "./GlobalNav";
import ExternalNavElement from "./ExternalNav";
import KawaiiBetterInformatics from "../../assets/kawaii-betterinformatics.svg?react";
import classes from "./MobileHeader.module.css";
import clsx from "clsx";

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
  const [uwu, _] = useLocalStorageState("uwu", false);

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
          {uwu ? <KawaiiBetterInformatics className={classes.logo}/> : (
            <img
              src={signet}
              alt="Signet of the student organization"
              className={clsx(classes.logo, classes.invertedLogo)}
            />
          )}
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
