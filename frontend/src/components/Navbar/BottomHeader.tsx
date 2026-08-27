import * as React from "react";
import { Box, Container, Group } from "@mantine/core";
import type { MantineSize } from "@mantine/core";
import { NavItem, translate } from "./GlobalNav";
import ExternalNavElement from "./ExternalNav";
import ColorSchemeToggle from "../color-scheme-toggle";
import { QuickSearchBox } from "./QuickSearch/QuickSearchBox";
import { ReactNode } from "react";
import { Link } from "react-router-dom";
import classes from "./BottomHeader.module.css";
import KawaiiBetterInformatics from "../../assets/kawaii-betterinformatics.svg?react";
import { useLocalStorageState } from "ahooks";

interface Props {
  lang: "en" | "de" | string;
  appNav: NavItem[];
  title: string;
  loginButton?: ReactNode;
  size: MantineSize | undefined;
  icon?: string;
}

const BottomHeader: React.FC<Props> = ({
  lang,
  appNav,
  title: _unused,
  loginButton,
  size,
  icon,
}) => {
  const [uwu, _] = useLocalStorageState("uwu", false);
  return (
    <>
      <Box visibleFrom="md" className={classes.placeholder} />
      <Box visibleFrom="md" className={classes.navbar}>
        <Container size={size ?? "md"} className={classes.container}>
          <Link to="/" className={classes.title}>
            {uwu ? (
              <KawaiiBetterInformatics className={classes.logo} />
            ) : (
              icon && (
                <img
                  src={icon}
                  alt="Better Informatics Icon"
                  className={classes.logo}
                />
              )
            )}
          </Link>

          <Group wrap="nowrap" gap="0.5rem" align="center" h="100%" flex="1">
            {translate(appNav, lang).map((item, i) => {
              return (
                <ExternalNavElement
                  item={item}
                  mobile={false}
                  isExternal={false}
                  key={i}
                  titleClassName={classes.navItem}
                />
              );
            })}
            <QuickSearchBox />
            {loginButton}
          </Group>
          <ColorSchemeToggle />
        </Container>
      </Box>
    </>
  );
};

export default BottomHeader;
