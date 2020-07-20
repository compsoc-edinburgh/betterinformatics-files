import {
  Badge,
  ICONS,
  NavbarBrand,
  VSETHNavbar as Navbar,
} from "@vseth/components";
import { Item } from "@vseth/components/dist/components/VSETHNav/VSETHNavbar";
import React from "react";
import { useLocation } from "react-router-dom";
import { fetchGet } from "../api/fetch-utils";
import { useUser } from "../auth";
import { useRequest } from "@umijs/hooks";
const loadUnreadCount = async () => {
  return (await fetchGet("/api/notification/unreadcount/")).value as number;
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
          title: "FAQ",
          active: location.pathname === "/faq",
          linkProps: {
            to: "/faq",
          },
        },
        {
          title: "Feedback",
          active: location.pathname === "/feedback",
          linkProps: {
            to: "/feedback",
          },
        },
        {
          title: "Scoreboard",
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
            ...(typeof user === "object" && user.isCategoryAdmin
              ? adminItems
              : []),
          ],
        },
        {
          title: "Search",
          icon: ICONS.SEARCH,
          active: location.pathname.indexOf("/search") === 0,
          linkProps: { to: "/search" },
        },
        {
          title: ((
            <span>
              Account
              {unreadCount !== undefined && unreadCount > 0 && (
                <>
                  {" "}
                  <Badge className="small">{unreadCount}</Badge>
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
