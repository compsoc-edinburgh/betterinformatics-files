import {
  Badge,
  NavbarBrand,
  VSETHNavbar as Navbar,
  NavLinkProps,
  HomeIcon,
  SearchIcon,
  UserIcon,
} from "@vseth/components";
import { Item } from "@vseth/components/dist/components/VSETHNav/VSETHNavbar";
import React from "react";
import { useLocation, NavLink } from "react-router-dom";
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
    pollingInterval: 300_000,
  });
  const username = user?.username;
  const adminItems: Item[] = [
    {
      title: "Upload Exam",
      href: "/uploadpdf",
    },
    {
      title: "Mod Queue",
      href: "/modqueue",
    },
  ];

  const navlink: React.FC<NavLinkProps> = ({ href, children }) => {
    return (
      <NavLink to={href || ""} className="nav-link">
        {children}
      </NavLink>
    );
  };

  return (
    <Navbar
      NavLink={navlink}
      lang={"en"}
      secondaryLogo={<NavbarBrand href="/">Community Solutions</NavbarBrand>}
      primaryActionItems={[]}
      secondaryNavItems={[
        {
          title: "Home",
          icon: HomeIcon,
          active: location.pathname === "/",
          href: "/",
        },
        {
          title: "Scoreboard",
          active: location.pathname === "/scoreboard",
          href: "/scoreboard",
        },
        {
          title: "More",
          active: false,

          childItems: [
            {
              title: "FAQ",
              active: location.pathname === "/faq",
              href: "/faq",
            },
            {
              title: "Feedback",
              active: location.pathname === "/feedback",
              href: "/feedback",
            },
            {
              title: "Submit Transcript",
              href: "/submittranscript",
            },
            ...(typeof user === "object" && user.isCategoryAdmin
              ? adminItems
              : []),
          ],
        },
        {
          title: "Search",
          icon: SearchIcon,
          active: location.pathname.indexOf("/search") === 0,
          href: "/search",
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
          icon: UserIcon,
          active: location.pathname === `/user/${username}`,
          href: `/user/${username}`,
        },
      ]}
    />
  );
};
export default ExamsNavbar;
