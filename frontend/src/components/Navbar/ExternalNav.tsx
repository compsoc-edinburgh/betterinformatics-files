import * as React from "react";
import { ReactNode } from "react";
import { Anchor, Center, Container, Menu } from "@mantine/core";

import { NavItem } from "./GlobalNav";
import clsx from "clsx";
import { NavLink } from "react-router-dom";
import { IconChevronDown } from "@tabler/icons-react";
import classes from "./ExternalNav.module.css";

interface Props {
  item: NavItem;
  mobile: boolean;
  isExternal: boolean;
  titleClassName?: string;
}

const ExternalNavElement: React.FC<Props> = ({
  item,
  mobile,
  isExternal,
  titleClassName: textClassName,
}) => {
  return item.childItems ? (
    mobile ? (
      <>
        <div className={clsx(classes.navItem, textClassName)}>
          {item.title as ReactNode}
        </div>
        {item.childItems.map((childItem, i) => (
          <Anchor
            key={i}
            component={NavLink}
            display={"block"}
            to={childItem.href!}
            className={clsx(classes.link, classes.mobileChild, textClassName)}
          >
            {childItem.title as ReactNode}
          </Anchor>
        ))}
      </>
    ) : (
      <Menu position="bottom-end" closeOnItemClick={true} width={200}>
        <Menu.Target>
          <Container
            style={{ display: "flex", padding: 0 }}
            className={classes.navItem}
            fluid={true}
          >
            <Center>
              <div style={{ lineHeight: "1.75rem", marginRight: "6px" }}>
                {item.title as ReactNode}
              </div>
              <IconChevronDown style={{ marginTop: "2px" }} />
            </Center>
          </Container>
        </Menu.Target>
        <Menu.Dropdown>
          {item.childItems.map((childItem, i) =>
            isExternal ? (
              <Menu.Item
                display={"block"}
                component={"a"}
                target={"_blank"}
                href={childItem.href}
                className={clsx(classes.link, classes.childItem, textClassName)}
                onClick={childItem.onClick ? childItem.onClick : undefined}
                key={i}
                pl="xs"
                py="xs"
              >
                {childItem.title as ReactNode}
              </Menu.Item>
            ) : (
              <Menu.Item
                display={"block"}
                component={NavLink}
                to={childItem.href!}
                className={clsx(classes.link, classes.childItem, textClassName)}
                onClick={childItem.onClick ? childItem.onClick : undefined}
                key={i}
                pl="xs"
                py="xs"
              >
                {childItem.title as ReactNode}
              </Menu.Item>
            ),
          )}
        </Menu.Dropdown>
      </Menu>
    )
  ) : (
    <Anchor
      component={NavLink}
      to={item.href!}
      size="lg"
      className={clsx(classes.navItem, classes.link, textClassName)}
    >
      {item.title as ReactNode}
    </Anchor>
  );
};

export default ExternalNavElement;
