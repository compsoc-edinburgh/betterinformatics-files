import * as React from "react";
import { Container, Group } from "@mantine/core";
import type { MantineSize } from "@mantine/core";
import { NavItem, translate } from "./GlobalNav";
import ExternalNavElement from "./ExternalNav";
import { ReactNode } from "react";
import { Link } from "react-router-dom";
import classes from "./BottomHeader.module.css";

interface Props {
  lang: "en" | "de" | string;
  appNav: NavItem[];
  title: string;
  loginButton?: ReactNode;
  size: MantineSize | undefined;
}

const BottomHeader: React.FC<Props> = ({
  lang,
  appNav,
  title,
  loginButton,
  size,
}) => {
  return (
    <Container visibleFrom="md" className={classes.navbar} fluid={true}>
      <Container size={size ? size : "md"} className={classes.container}>
        <Link to={""} className={classes.title}>
          {title}
        </Link>

        <Group
          style={{
            justifyContent: "flex-end",
          }}
          wrap="nowrap"
          gap="2.75rem"
        >
          {translate(appNav, lang).map((item, i) => {
            return (
              <ExternalNavElement
                item={item}
                mobile={false}
                isExternal={false}
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
