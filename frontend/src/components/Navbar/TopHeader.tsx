import * as React from "react";
import { Container, createStyles } from "@mantine/core";
import type { MantineNumberSize } from "@mantine/core";

import { globalNav, translate, _NavItem } from "./_GlobalNav";
import _ExternalNavElement from "./_ExternalNav";

const useStyles = createStyles((theme, _params) => ({
  navbar: {
    height: "3.5rem",
    color: "white",
    width: "100%",
    [theme.fn.smallerThan("md")]: {
      display: "none",
    },
  },
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: "100%",
  },
  logo: {
    height: "2rem",
    filter: "brightness(0) invert(1)",
  },
  items: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "2.75rem",
  },
}));

interface Props {
  selectedLanguage: "en" | "de" | string;
  languages?: { key: string; label: string }[];
  onLanguageSelect: (language: string) => void;
  organizationNav?: _NavItem[];
  logo: string | undefined;
  size: MantineNumberSize | undefined;
}

const TopHeader: React.FC<Props> = ({
  selectedLanguage,
  languages,
  organizationNav,
  logo,
  onLanguageSelect,
  size,
}) => {
  const { classes } = useStyles();

  return (
    <Container
      className={classes.navbar}
      fluid={true}
      sx={(theme: any) => {
        return {
          backgroundColor: "rgba(51,51,51)",
        };
      }}
    >
      <Container size={size ? size : "xl"} className={classes.container}>
        <img
          src={
            logo
              ? logo
              : "https://static.vseth.ethz.ch/assets/vseth-0000-vseth/logo-mono.svg"
          }
          className={classes.logo}
          alt="Logo of the student organization"
        />
        <div className={classes.items}>
          {translate(
            organizationNav ? organizationNav : globalNav,
            selectedLanguage,
          ).map((item, i) => (
            <_ExternalNavElement
              item={item}
              lightBg={false}
              mobile={false}
              key={i}
            />
          ))}
          {languages ? (
            <_ExternalNavElement
              item={{
                title: selectedLanguage,
                childItems: languages.map(lang => {
                  return {
                    title: lang.label,
                    onClick: () => onLanguageSelect(lang.key),
                  };
                }),
              }}
              lightBg={false}
              mobile={false}
            />
          ) : undefined}
        </div>
      </Container>
    </Container>
  );
};

export default TopHeader;
