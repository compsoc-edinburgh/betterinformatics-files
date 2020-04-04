import React from "react";
import {
  VSETHNavbar as Navbar,
  NavbarBrand,
  ICONS,
  Badge,
} from "@vseth/components";
import { useLocation } from "react-router-dom";
import { useUser } from "../auth";
import { Item } from "@vseth/components/dist/components/VSETHNav/VSETHNavbar";
import { useRequest } from "@umijs/hooks";
import { fetchapi } from "../api/fetch-utils";
const loadUnreadCount = async () => {
  return (await fetchapi("/api/notification/unreadcount/")).value as number;
};
const ExamsNavbar: React.FC<{}> = () => {
  const location = useLocation();
  const user = useUser();
  const { data: unreadCount } = useRequest(loadUnreadCount, {
    pollingInterval: 30_000,
  });
  const username = user?.username;
  const adminItems: Item[] = [
    {
      title: "Upload Exam",
      linkProps: {
        to: "/uploadpdf",
      },
    },
    {
      title: "Mod Queue",
      linkProps: {
        to: "/modqueue",
      },
    },
  ];
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
          title: "More",
          active: false,

          childItems: [
            {
              title: "Submit Transcript",
              linkProps: {
                to: "/submittranscript",
              },
            },
            ...(typeof user === "object" && user.isAdmin ? adminItems : []),
          ],
        },
        {
          title: ((
            <span>
              Account
              {unreadCount !== undefined && unreadCount > 0 && (
                <>
                  {" "}
                  <Badge style={{ fontSize: "0.9em" }}>{unreadCount}</Badge>
                </>
              )}
            </span>
          ) as unknown) as string,
          icon: ICONS.USER,
          active: location.pathname === `/user/${username}`,
          linkProps: {
            to: `/user/${username}`,
          },
        },
      ]}
    />
  );
};
export default ExamsNavbar;
