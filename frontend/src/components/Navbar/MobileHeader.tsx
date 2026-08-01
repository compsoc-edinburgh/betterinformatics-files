import * as React from "react";
import { ReactNode } from "react";
import { Burger, Container, Group, Indicator, Stack } from "@mantine/core";
import { useLocalStorageState } from "ahooks";
import { NavItem, translate } from "./GlobalNav";
import ExternalNavElement from "./ExternalNav";
import KawaiiBetterInformatics from "../../assets/kawaii-betterinformatics.svg?react";
import classes from "./MobileHeader.module.css";
import { Link } from "react-router-dom";
import ColorSchemeToggle from "../color-scheme-toggle";

interface Props {
  selectedLanguage: "en" | "de" | string;
  appNav: NavItem[];
  title: string;
  loginButton?: ReactNode;
  signet: string;
}
const BottomHeader: React.FC<Props> = ({
  selectedLanguage,
  appNav,
  title,
  loginButton,
  signet,
}) => {
  const [opened, setOpened] = React.useState(false);
  const [uwu, _] = useLocalStorageState("uwu", false);

  return (
    <Container hiddenFrom="md" className={classes.navbar} fluid={true}>
      <Group
        className={classes.logoLine}
        align="center"
        justify="space-between"
        gap="0.5rem"
      >
        {uwu ? (
          <KawaiiBetterInformatics className={classes.logo} />
        ) : (
          <img
            src={signet}
            alt="Signet of the student organization"
            className={classes.logo}
          />
        )}
        <div className={classes.title}>
          <Link to={""} style={{ color: "inherit", textDecoration: "none" }}>
            {title}
          </Link>
        </div>
        <Group>
          <ColorSchemeToggle />
          <Indicator
            /** All items have no indicators, and all subitems (if they exist) have no indicators */
            disabled={appNav.every(
              item =>
                !item.indicator &&
                (!item.childItems ||
                  item.childItems.every(child => !child.indicator)),
            )}
            offset={4}
            color="compsocMain"
          >
            <Burger
              opened={opened}
              onClick={() => setOpened((o: boolean) => !o)}
              size="sm"
            />
          </Indicator>
        </Group>
      </Group>
      {opened ? (
        <Stack align="flex-start" gap="xs" py="xs">
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
