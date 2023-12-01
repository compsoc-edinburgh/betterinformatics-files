import * as React from "react";
import { ReactNode } from "react";
import { Anchor, Center, Container, createStyles, Menu } from "@mantine/core";

import { _NavItem } from "./_GlobalNav";
import { cx } from "@emotion/css";
import { Icon, ICONS } from "vseth-canine-ui";
import { NavLink } from "react-router-dom";

const useStyles = createStyles(
  (
    _theme,
    {
      color,
      hoverColor,
      mobile,
    }: { color: string; hoverColor: string; mobile: boolean },
  ) => ({
    navItem: {
      paddingLeft: "0rem",
      paddingRight: "0rem",
      textAlign: mobile ? "left" : "right",
      cursor: "pointer",
      color,
      "&:hover": {
        color: hoverColor,
      },
      fontSize: "1.125rem",
      lineHeight: "1.75rem",
      textTransform: "uppercase",
      fontWeight: 500,
      display: mobile ? "block" : "initial",
    },
    childItem: {
      color: "rgba(51,51,51) !important",
      "&:hover": {
        color: "rgba(51,51,51)",
      },
      fontSize: "1rem",
      lineHeight: "1.5rem",
      cursor: "pointer",
      fill: "rgba(51, 51, 51, 0.5)",
    },
    link: {
      textDecoration: "none !important",
      color,
      "&:hover": {
        color: hoverColor,
      },
      width: "100%",
    },
    active: {
      borderBottom: `solid 0.25rem ${color}`,
    },
  }),
);

interface Props {
  item: _NavItem;
  lightBg: boolean;
  mobile: boolean;
  activeHref?: string;
}
const _ExternalNavElement: React.FC<Props> = ({
  item,
  lightBg,
  mobile,
  activeHref,
}) => {
  const active = typeof activeHref !== "undefined" && activeHref === item.href;
  let color = lightBg ? "rgba(51,51,51)" : "rgba(255,255,255,0.8)";
  let hoverColor = lightBg ? "rgba(51,51,51)" : "rgba(255,255,255,1)";
  color = active || mobile ? hoverColor : color;
  hoverColor = !mobile ? hoverColor : color;

  const { classes } = useStyles({ color, hoverColor, mobile });

  return item.childItems ? (
    <Menu position="bottom-end" closeOnItemClick={true} width={200}>
      <Menu.Target>
        <Container
          style={{ display: "flex" }}
          className={classes.navItem}
          fluid={true}
        >
          <Center>
            <div style={{ lineHeight: "1.75rem", marginRight: "6px" }}>
              {item.title as ReactNode}
            </div>
            <Icon
              style={{ marginTop: "2px" }}
              icon={ICONS.DOWN}
              color={color}
              size={12}
            />
          </Center>
        </Container>
      </Menu.Target>
      <Menu.Dropdown>
        {item.childItems.map((childItem, i) => (
          <Menu.Item
            onClick={childItem.onClick ? childItem.onClick : undefined}
            key={i}
            pl="xs"
            py="xs"
          >
            <Anchor
              target="_blank"
              display={"block"}
              href={childItem.href}
              className={cx(classes.link, classes.childItem)}
            >
              {childItem.title as ReactNode}
            </Anchor>
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  ) : (
    // <Container
    //   className={cx(classes.navItem, { [classes.active]: active })}
    //   fluid={true}
    // >
    <Anchor
      component={NavLink}
      to={item.href!}
      className={cx(classes.navItem, classes.link)}
    >
      {item.title as ReactNode}
    </Anchor>
    // </Container>
  );
};

export default _ExternalNavElement;
