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
import { Link } from "react-router-dom";

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
      linkProps: {
        href: "/uploadpdf",
        // This is a temporary fix that makes dropdown items look normal
        ...{ className: "dropdown-item" },
      },
    },
    {
      title: "Mod Queue",
      linkProps: {
        href: "/modqueue",
        ...{ className: "dropdown-item" },
      },
    },
  ];

  const navlink: React.FC<NavLinkProps> = ({ href, children, className }) => {
    return (
      <NavLink to={href || ""} className={className ?? "nav-link"}>
        {children}
      </NavLink>
    );
  };

  return (
    <Navbar
      NavLink={navlink}
      lang={"en"}
      secondaryLogo={
        <NavbarBrand to="/" tag={Link}>
          Community Solutions
        </NavbarBrand>
      }
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
              linkProps: {
                href: "/faq",
                ...{ className: "dropdown-item" },
              },
            },
            {
              title: "Feedback",
              active: location.pathname === "/feedback",
              linkProps: {
                href: "/feedback",
                ...{ className: "dropdown-item" },
              },
            },
            {
              title: "Submit Transcript",
              linkProps: {
                href: "/submittranscript",
                ...{ className: "dropdown-item" },
              },
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
          title: (
            <span>
              Account
              {unreadCount !== undefined && unreadCount > 0 && (
                <>
                  {" "}
                  <Badge className="small">{unreadCount}</Badge>
                </>
              )}
            </span>
          ),
          icon: UserIcon,
          active: location.pathname === `/user/${username}`,
          href: `/user/${username}`,
        },
      ]}
    />
  );
};
export default ExamsNavbar;
