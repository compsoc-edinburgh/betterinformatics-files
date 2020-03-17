import React from "react";
import { VSETHNavbar as Navbar, NavbarBrand, ICONS } from "@vseth/components";
import { useLocation } from "react-router-dom";
const ExamsNavbar: React.FC<{}> = () => {
  const location = useLocation();
  return (
    <Navbar
      lang={"en"}
      secondaryLogo={<NavbarBrand href="/">Community Solutions</NavbarBrand>}
      primaryActionItems={[]}
      secondaryNavItems={[
        {
          title: "Home",
          icon: ICONS.HOME,
          active: location.pathname === "/",
          linkProps: {
            to: "/",
          },
        },
        {
          title: "Feedback",
          icon: ICONS.MESSAGE,
          active: location.pathname === "/feedback",
          linkProps: {
            to: "/feedback",
          },
        },
        {
          title: "Scoreboard",
          icon: ICONS.LIST,
          active: location.pathname === "/scoreboard",
          linkProps: {
            to: "/scoreboard",
          },
        },
        {
          title: "Account",
          icon: ICONS.USER,
          active: location.pathname === "/me",
          linkProps: {
            to: "/me",
          },
        },
      ]}
    />
  );
};
export default ExamsNavbar;
