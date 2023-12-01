import * as React from "react";
import { Container, createStyles, Group } from "@mantine/core";
import type { MantineNumberSize } from "@mantine/core";
import { _NavItem, translate } from "./_GlobalNav";
import _ExternalNavElement from "./_ExternalNav";
import { ReactNode } from "react";
import { Link } from "react-router-dom";

const useStyles = createStyles((theme, _params, _getRef) => ({
  navbar: {
    height: "3.5rem",
    boxShadow: theme.shadows.sm,
    [theme.fn.smallerThan("md")]: {
      display: "none",
    },
  },
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "nowrap",
    height: "100%",
  },
  title: {
    textDecoration: "none",
    width: "12.5rem",
    color:
      theme.colorScheme === "light"
        ? "rgba(51,51,51)"
        : "rgba(255,255,255,0.8)",
    fontWeight: 400,
    fontSize: "1.25rem",
  },
}));

interface Props {
  lang: "en" | "de" | string;
  appNav: _NavItem[];
  title: string;
  activeHref?: string;
  loginButton?: ReactNode;
  size: MantineNumberSize | undefined;
}
const BottomHeader: React.FC<Props> = ({
  lang,
  appNav,
  title,
  activeHref,
  loginButton,
  size,
}) => {
  const { classes, theme } = useStyles();

  return (
    <Container className={classes.navbar} fluid={true}>
      <Container size={size ? size : "md"} className={classes.container}>
        <Link to={""} className={classes.title}>
          {title}
        </Link>

        <Group
          style={{
            justifyContent: "flex-end",
          }}
          noWrap
          spacing="2.75rem"
        >
          {translate(appNav, lang).map((item, i) => {
            return (
              <_ExternalNavElement
                item={item}
                lightBg={theme.colorScheme === "light"}
                mobile={false}
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
