import * as React from "react";
import { Container, Group } from "@mantine/core";
import type { MantineSize } from "@mantine/core";
import { NavItem, translate } from "./GlobalNav";
import ExternalNavElement from "./ExternalNav";
import { ReactNode } from "react";
import { Link } from "react-router-dom";
import classes from "./BottomHeader.module.css";
import KawaiiBetterInformatics from "../../assets/kawaii-betterinformatics.svg?react";
import { useLocalStorageState } from "@umijs/hooks";

interface Props {
  lang: "en" | "de" | string;
  appNav: NavItem[];
  title: string;
  activeHref?: string;
  loginButton?: ReactNode;
  size: MantineSize | undefined;
  icon?: string;
}

const BottomHeader: React.FC<Props> = ({
  lang,
  appNav,
  title,
  activeHref,
  loginButton,
  size,
  icon,
}) => {
  const [uwu, _] = useLocalStorageState("uwu", false);
  return (
    <Container visibleFrom="md" className={classes.navbar} fluid={true}>
      <Container size={size ? size : "md"} className={classes.container}>
        <Link to={""} className={classes.title}>
          {uwu ? <KawaiiBetterInformatics className={classes.logo}/> : icon && (
            <img
              src={icon}
              alt="BetterInformatics Icon"
              className={classes.logo}
            />
          )}
          {title}
        </Link>

        <Group
          justify="flex-end"
          wrap="nowrap"
          gap="2.75rem"
        >
          {translate(appNav, lang).map((item, i) => {
            return (
              <ExternalNavElement
                item={item}
                mobile={false}
                isExternal={false}
                activeHref={activeHref}
                key={i}
              />
            );
          })}
          {loginButton}
        </Group>
      </Container>
    </Container>
  );
};

export default BottomHeader;
